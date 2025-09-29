import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

// 模板渲染函数
function renderTemplate(template: string, context: Record<string, any> = {}) {
	return template.replace(/\{\{(.*?)\}\}/g, (_, expr) => {
		try {
			return new Function(...Object.keys(context), `return (${expr})`)(...Object.values(context));
		} catch (e) {
			return "";
		}
	});
}

export class LangfusePrompt implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Langfuse Prompt',
		name: 'langfusePrompt',
		group: ['transform'],
		version: 1,
		description: 'Fetch a prompt from Langfuse and render with variables',
		defaults: {
			name: 'Langfuse Prompt',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'langfuseApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Prompt Name',
				name: 'promptName',
				type: 'string',
				default: '',
				required: true,
			},
			{
				displayName: 'Prompt Label',
				name: 'promptLabel',
				type: 'string',
				default: 'production',
				description: 'Optional label, defaults to "production"',
			},
			{
				displayName: 'Variables (JSON)',
				name: 'vars',
				type: 'json',
				default: '{}',
				description: 'Key-value pairs for template rendering',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// 获取 credentials
		const credentials = await this.getCredentials('langfuseApi');
		const baseUrl = credentials.baseUrl as string;
		const publicKey = credentials.publicKey as string;
		const secretKey = credentials.secretKey as string;

		// Basic Auth header
		const authHeader = 'Basic ' + Buffer.from(`${publicKey}:${secretKey}`).toString('base64');

		for (let i = 0; i < items.length; i++) {
			const promptName = this.getNodeParameter('promptName', i) as string;
			const promptLabel = this.getNodeParameter('promptLabel', i) as string;
			const vars = this.getNodeParameter('vars', i, {}) as string;

			// URL 使用 query 参数
			const url = `${baseUrl}/api/public/v2/prompts/${encodeURIComponent(promptName)}?label=${encodeURIComponent(promptLabel)}`;

			// 调用 Langfuse API
			const response = await this.helpers.request({
				method: 'GET',
				url,
				headers: {
					Authorization: authHeader,
				},
				json: true,
			});

			const rawTemplate = response?.prompt ?? '';
			const rendered = renderTemplate(rawTemplate, JSON.parse(vars));

			returnData.push({
				json: {
					name: promptName,
					label: promptLabel || null,
					rawTemplate,
					vars,
					prompt: rendered,
				},
			});
		}

		return [returnData];
	}
}
