import { CryptoWASM } from "../wasm/crypto-wasm";
import { IRingSignFactory, IRingSignature, IKeyImage, RING_CONSTANTS } from "../interfaces/i-ring-sign";
import { ISignKeyPair, ISignPublicKey } from "../interfaces/i-sign";
import { PublicKeyArray, RingSignature } from "../wasm/crypto-wasm-types";
import { BufferUtility } from "@util/index";

export class RingSignFactory implements IRingSignFactory {
    public constants = RING_CONSTANTS;
    public async sign(
        msg: Uint8Array,
        secretKeyPair: ISignKeyPair,
        ring: ISignPublicKey[],
        keyImage?: IKeyImage
    ): Promise<IRingSignature> {
        await CryptoWASM.ready();
        const hash = await CryptoWASM.hash(msg);
        if (keyImage == null) {
            keyImage = {
                    r_key_image: await CryptoWASM.generateKeyImage(
                        secretKeyPair.s_public_key.s_public_data,
                        secretKeyPair.s_secret_key.s_secret_data
                    )
                };
        }

        const sPubb64 = Buffer.from(secretKeyPair.s_public_key.s_public_data);
        const secIndex = ring.findIndex((pub) => {
            return sPubb64.equals(Buffer.from(pub.s_public_data));
        });
        if (secIndex < 0) {
            throw new Error("Ring does not contain provided keyPair's public key");
        }

        const publicKeyArray = new PublicKeyArray(BufferUtility.concat(ring.map((pub) => pub.s_public_data)));

        const ringSig = await CryptoWASM.generateRingSignature(
            hash,
            keyImage.r_key_image,
            secretKeyPair.s_secret_key.s_secret_data, secIndex,
            publicKeyArray
        );

        return {
            r_key_image: keyImage,
            r_signature: ringSig
        };
    }

    public async verify(msg: Uint8Array, ring: ISignPublicKey[], ringSignature: IRingSignature): Promise<boolean> {
        await CryptoWASM.ready();
        const hash = await CryptoWASM.hash(msg);

        const publicKeyArray = new PublicKeyArray(BufferUtility.concat(ring.map((pub) => pub.s_public_data)));

        const ringSig = new RingSignature(ringSignature.r_signature);

        return await CryptoWASM.checkRingSignature(
            hash,
            ringSignature.r_key_image.r_key_image,
            publicKeyArray,
            ringSig
        );
    }
}
