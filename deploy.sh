rm -rf cache
rm -rf artifacts
rm -rf .openzeppelin
rm -rf .bin

npx hardhat run --network avaxfuji scripts/deployNode.ts
exit


npx hardhat run --network avaxfuji scripts/deployProxyToken.ts
exit

npx hardhat verify --network avaxfuji 0x444C26ccE2dCe3B64c35c483e9E2Cc12eB4446cD
#npx hardhat verify --network avaxfuji  --constructor-args NodeManagerV2Arguments.js 0x5C50450a5EFfd260C4Ed20d0A4B90d81c0A862C4




    #routerAddress = w3.toChecksumAddress("0x7E3411B04766089cFaa52DB688855356A12f05D1") hurricaneswap fuji
    #routerAddress = w3.toChecksumAddress("0x2D99ABD9008Dc933ff5c0CD271B88309593aB921") # pangolin fuji
    #routerAddress = w3.toChecksumAddress("0x60aE616a2155Ee3d9A68541Ba4544862310933d4") # traderjoe main
    #routerAddress = w3.toChecksumAddress("0x5db0735cf88F85E78ed742215090c465979B5006") # traderjoe fuji