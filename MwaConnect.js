import {useLoginWithSiwe} from '@privy-io/expo';

export function LoginScreen() {
const [address, setAddress] = useState('');
const [message, setMessage] = useState('');
const {generateSiweMessage} = useLoginWithSiwe();

const handleGenerate = async () => {
    const message = await generateSiweMessage({
    from: {
        domain: 'my-domain.com',
        uri: 'https://my-domain.com',
    },
    wallet: {
        // sepolia chainId with CAIP-2 prefix
        chainId: `eip155:11155111`,
        address,
    },
    });

    setMessage(message);
};

return (
    <View>
    <TextInput
        value={address}
        onChangeText={setAddress}
        placeholder="0x..."
        inputMode="ascii-capable"
    />

    <Button onPress={handleGenerate}>Generate Message</Button>

    {Boolean(message) && <Text>{message}</Text>}
    </View>
);
}