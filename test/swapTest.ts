import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {Contract} from "ethers";
import {Done} from "mocha";

const {expect} = require("chai");
const {ethers, upgrades} = require("hardhat");
const {factory} = require("typescript");
const {parseEther, formatEther} = ethers.utils;
const util = require('../scripts/util.ts');
const hre = require("hardhat");

let deployer: SignerWithAddress;
let bob: SignerWithAddress;
let alice: SignerWithAddress;
let token: Contract;
let pairContract: Contract;
let routerFactory: Contract;
let lpPairAddress: string;
let router: Contract;

let busdContract: Contract;
let wAvaxContract: Contract;

let verbose = true;
const timeoutDelay = 1000 * 60 * 30; // 10 mins
// @ts-ignore
let provider = ethers.provider;


describe("Token contract", async () => {

    /*
    beforeEach(async () => {
        let signers = await ethers.getSigners();
        deployer = signers[0];
        bob = signers[0];
        alice = signers[0];

        console.log("deployer", deployer.address);
        console.log("bob", bob.address);
        console.log("alice", alice.address);

        const Token = await ethers.getContractFactory("LIFEGAMESV2");
        const TokenDeployed = await upgrades.deployProxy(Token, {initializer: "initialize"});
        token = await TokenDeployed.deployed();
        console.log("Contract deployed to:", token.address);
    })
    */

    it("Deployment", async () => {
        // GET SIGNERS
        let signers = await ethers.getSigners();
        deployer = signers[0];
        bob = signers[1];
        alice = signers[2];

        console.log("Deployer: ", deployer.address);
        console.log("Bob: ", bob.address);
        console.log("Alice: ", alice.address);
        console.log();

        // DEPLOY TOKEN V1
        const Token = await ethers.getContractFactory("TokenV1");
        const TokenDeployed = await upgrades.deployProxy(Token, {initializer: "initialize"});
        token = await TokenDeployed.deployed();
        console.log("Contract deployed to:", token.address);
        console.log();

        // GET BALANCES
        const deployerTokenBalance = await token.balanceOf(deployer.address);
        console.log("Token Balance:", formatEther(deployerTokenBalance));
        const bobTokenBalance = await token.balanceOf(bob.address);
        console.log("Token Balance:", formatEther(bobTokenBalance));
        const aliceTokenBalance = await token.balanceOf(alice.address);
        console.log("Token Balance:", formatEther(aliceTokenBalance));

        // INSTANCE ROUTER CONTRACT
        router = await util.connectRouter()
        console.log("router", router.address);
        console.log();

        // INSTANCE WAVAX CONTRACT
        wAvaxContract = await util.connectWAVAX()
        console.log("wAVAX Contract Address:", wAvaxContract.address);
        console.log();

        // INSTANCE ROUTER FACTORY
        routerFactory = await util.connectFactory()
        console.log("Router Factory Contract Address:", routerFactory.address);
        console.log();

        // GET LP PAIR ADDRESS FROM TOKEN -> SHOULD BE 0x00000......0000
        pairContract = await util.connectPair(await token.lpPair())
        console.log("pair", pairContract.address);
        console.log();
        expect(pairContract.address).to.eq("0x0000000000000000000000000000000000000000");

        // CREATE TOKEN PAIR
        const createPairWriteCall = await token.createPair(util.avalancheFujiTestnet.WAVAX,token.address);
        //const enableTrading = await token.enableTrading();

        // GET LP PAIR ADDRESS FROM TOKEN -> SHOULD BE DISTINCT 0x00000......0000
        pairContract = await util.connectPair(await token.lpPair())
        console.log("pair", pairContract.address);
        console.log();

        // GET LP PAIR ADDRESS FROM ROUTER
        lpPairAddress = await routerFactory.getPair(util.avalancheFujiTestnet.WAVAX, token.address)

        // BOTH ADDRESSES SHOULD BE EQUAL
        expect(lpPairAddress).to.eq(pairContract.address);


        await addLiquidity();

        /*

        await addLiqLFG();

        const logicAddress: string = await util.getProxyImplementation(token.address)
        Pfactory = await util.connectFactory()
        factoryPairAddress = await Pfactory.getPair(util.pancakeTestnet.BUSD, token.address)

        expect(factoryPairAddress).to.eq(pairContract.address);

        console.log("Proxy Address:", token.address);
        console.log("Logic:", logicAddress);
        console.log("Pair Address:", pairContract.address);
        console.log("Factory Pair Address:", factoryPairAddress);

        // -----------------------------------------------------------------------

        console.log("LFG - [LIQ] Verify Liq Wallet gets 1% tokens from non-excluded buy ");
        await buyTestnonExcluded("liquidity", 0.01, util.tWallets.lFee);

        let seconds = 10000;
        await sleep(1000 * seconds);

        //console.log("LFG - [LIQ] Verify Liq Wallet gets 1% tokens from non-excluded buy ");
        await buyTestnonExcluded("liquidity", 0.01, util.tWallets.bbFee);

        //console.log("LFG - [LIQ] Verify reserve wallet gets 0.5% tokens from non-excluded buy ");
        //await buyTestnonExcluded("reserve", 0.005, util.tWallets.rFee);
        */
    }).timeout(timeoutDelay);

});

async function buyTestnonExcluded(name: string, perAmount: number, taxWallet: string) {
    console.log("LP Pair Address:", lpPairAddress)
    // deployer adds 10 BNB liquidity with all their tokens
    await addLiquidity()
    // buy BUSD with 1 BNB and buy LFG
    await util.swapApproveBNBtoBUSD(busdContract, router, bob, parseEther("1"))

    // Non Excluded buys LFG
    // get amountsOut
    let expected = await router.getAmountsOut(parseEther("10"), [busdContract.address, token.address])
    //buy 10 BUSD
    let bobLFGbalanceBefore = await token.balanceOf(bob.address)
    let taxWalletBalanceBefore = await token.balanceOf(taxWallet)
    await util.buyLFG(busdContract, token, router, bob, parseEther("10"))
    let bobLFGbalanceAfter = await token.balanceOf(bob.address)
    let taxWalletBalanceAfter = await token.balanceOf(taxWallet)

    // we should get buyer tokens
    let newTokens = formatEther(bobLFGbalanceAfter) - formatEther(bobLFGbalanceBefore)
    //expect(Number(newTokens)).to.be.gt(0)
    console.log("Expected: ", formatEther(expected[1]))
    console.log("Actual: ", newTokens)
    const diff = await util.diff(expected[1], newTokens)
    console.log("Diff %:", diff)
    //expect(Number(formatEther(expected[1]))).to.gt(newTokens)
    //expect(diff).to.be.closeTo(-3, 0.1);

    // check liquidity wallet change
    console.log(name, "wallet Before: ", formatEther(taxWalletBalanceBefore))
    console.log(name, "reserve wallet After: ", formatEther(taxWalletBalanceAfter))
    let liqNewTokens = formatEther(taxWalletBalanceAfter) - formatEther(taxWalletBalanceBefore)
    const liqExpectedGain = Number(formatEther(expected[1])) * perAmount
    console.log(name, "wallet add Expected: ", liqExpectedGain)
    console.log(name, "-- wallet add Actual: ", liqNewTokens)
    //expect(Number(liqNewTokens).toFixed(6)).to.be.eq(Number(liqExpectedGain).toFixed(6));
}

async function fundBUSD(user: SignerWithAddress, amount: any) {
    const whale = util.pancakeTestnet.whaleBUSD
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [whale],
    });

    const signer = await ethers.getSigner(whale)
    const busdBalance = await busdContract.balanceOf(whale)
    console.log("whale dai balance", formatEther(busdBalance))

    await busdContract.connect(signer).transfer(user.address, parseEther(amount))
    await busdContract.connect(user).approve(router.address, ethers.constants.MaxUint256);
    await busdContract.connect(user).approve(busdContract.address, ethers.constants.MaxUint256);
    console.log("fund with BUSD:", formatEther(await busdContract.balanceOf(user.address)));
    console.log();
}

async function addLiquidity() {
    //await fundBUSD(deployer, "400000");
    //await util.swapApproveBNBtoBUSD(busdContract, router, deployer, parseEther('10'));
    //const busdBalance = await busdContract.balanceOf(deployer.address);

    const avaxBalance = await deployer.getBalance();
    const tokenBalance = await token.balanceOf(deployer.address);
    console.log("Avax Balance:", formatEther(avaxBalance));
    console.log("Token Balance:", formatEther(tokenBalance));


    await util.approveAndAddLiquidity(token, router, deployer, parseEther("10"), parseEther("10"));
    //let lpBalance = await pairContract.balanceOf(deployer.address);

    //expect(Number(formatEther(lpBalance))).to.be.gt(0);
    //console.log("Deployer LP tokens:", formatEther(lpBalance))
    //console.log();
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
