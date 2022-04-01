import { expect } from "chai";
import { constants } from "ethers";
import { parseEther } from "ethers/lib/utils";

const {ethers, upgrades} = require("hardhat");


describe('Cat Token Proxy', () => {
   it('Full Cycle', async () => {
      const [signer] = await ethers.getSigners()

      const LegacyCatTokenFactory = await ethers.getContractFactory('LegacyCatToken')

      const legacyCatToken = await upgrades.deployProxy(LegacyCatTokenFactory)

      expect(await legacyCatToken.totalSupply()).to.eql(constants.Zero)

      const ModernCatTokenFactory = await ethers.getContractFactory('ModernCatToken')

      const modernCatToken = await ethers.upgradeProxy(legacyCatToken.address, ModernCatTokenFactory)
   
      expect(modernCatToken.address).to.eq(legacyCatToken.address)

      expect(await modernCatToken.totalSupply()).to.eql(constants.Zero)

      await modernCatToken.mint(signer.address, parseEther('1'))

      expect(await modernCatToken.totalSupply()).to.eql(await modernCatToken.balanceOf(signer.address)).to.eql(parseEther('1'))

   })
})