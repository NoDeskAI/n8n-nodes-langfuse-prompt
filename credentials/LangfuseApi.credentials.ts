import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class LangfuseApi implements ICredentialType {
	name = 'langfuseApi';
	displayName = 'Langfuse API (Basic Auth)';
	documentationUrl = 'https://langfuse.com/docs';
	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://langfuse.nodesk.tech',
			placeholder: 'https://langfuse.nodesk.tech',
			description: 'The base URL of your Langfuse instance',
			required: true,
		},
		{
			displayName: 'Public Key (Username)',
			name: 'publicKey',
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'Secret Key (Password)',
			name: 'secretKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
	];
}
