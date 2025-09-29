import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

// 定义类型
interface Assignment {
	id?: string;
	name: string;
	value: unknown;
	type?: string;
}

interface VarsWithAssignments {
	assignments: Assignment[];
}

// 模板渲染函数
function renderTemplate(
	template: string, 
	context: Record<string, unknown> = {}, 
	keepOriginalOnError: boolean = false
) {
	return template.replace(/\{\{(.*?)\}\}/g, (match, expr) => {
		try {
			const result = new Function(...Object.keys(context), `return (${expr})`)(...Object.values(context));
			// 如果结果是 undefined 或 null，根据参数决定返回什么
			if (result === undefined || result === null) {
				return keepOriginalOnError ? match : '';
			}
			return String(result);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (e) {
			// 表达式执行出错时，根据参数决定返回原值还是空字符串
			return keepOriginalOnError ? match : '';
		}
	});
}

// 转换 n8n vars 参数为 renderTemplate 可用的格式
function parseVarsParameter(vars: unknown, executeFunctions: IExecuteFunctions): Record<string, unknown> {
	let parsedVars: Record<string, unknown> = {};
	
	if (vars && typeof vars === 'object' && 'assignments' in vars) {
		// 处理 n8n 的 assignments 结构
		const varsWithAssignments = vars as VarsWithAssignments;
		const assignments = varsWithAssignments.assignments;
		if (Array.isArray(assignments)) {
			assignments.forEach((assignment: Assignment) => {
				if (assignment.name && assignment.value !== undefined) {
					parsedVars[assignment.name] = assignment.value;
				}
			});
		}
	} else if (typeof vars === 'string') {
		// 处理字符串形式的 JSON
		try {
			const parsed: unknown = JSON.parse(vars);
			if (parsed && typeof parsed === 'object' && 'assignments' in parsed) {
				// 处理解析后的 assignments 结构
				const varsWithAssignments = parsed as VarsWithAssignments;
				const assignments = varsWithAssignments.assignments;
				if (Array.isArray(assignments)) {
					assignments.forEach((assignment: Assignment) => {
						if (assignment.name && assignment.value !== undefined) {
							parsedVars[assignment.name] = assignment.value;
						}
					});
				}
			} else {
				// 处理普通的 JSON 对象
				parsedVars = (parsed as Record<string, unknown>) || {};
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new NodeOperationError(executeFunctions.getNode(), `无法解析 vars 参数为 JSON: ${errorMessage}`);
		}
	} else if (vars && typeof vars === 'object') {
		// 处理普通对象
		parsedVars = vars as Record<string, unknown>;
	}
	
	return parsedVars;
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
				displayName: 'Keep Original on Error',
				name: 'keepOriginalOnError',
				type: 'boolean',
				default: false,
				description: 'Whether to keep original {{variable}} when variable is missing or expression fails. If false, replaces with empty string.',
			},
			{
				displayName: 'Variables',
				name: 'vars',
				type: 'assignmentCollection',
				default: '',
				description: 'Key-value pairs for template rendering',
			}
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
			const vars = this.getNodeParameter('vars', i, {});
			const keepOriginalOnError = this.getNodeParameter('keepOriginalOnError', i, false) as boolean;
			
			// 使用提取的函数处理 vars 参数
			const parsedVars = parseVarsParameter(vars, this);
			
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
			const rendered = renderTemplate(rawTemplate, parsedVars, keepOriginalOnError);

			returnData.push({
				json: {
					name: promptName,
					label: promptLabel || null,
					rawTemplate,
					vars: parsedVars,
					prompt: rendered,
				},
			});
		}

		return [returnData];
	}
}
