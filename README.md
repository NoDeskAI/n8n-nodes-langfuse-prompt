# n8n-nodes-langfuse-prompt

This is an n8n community node. It lets you use Langfuse in your n8n workflows.

Langfuse is an open-source LLM engineering platform that helps with tracing, evaluations, prompt management, and metrics for LLM applications.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

- **Langfuse Prompt**: Fetch a prompt from Langfuse and render it with variables

## Credentials

You need to authenticate with your Langfuse instance:

1. Sign up for a Langfuse account or set up a self-hosted instance
2. Get your Public Key and Secret Key from the Langfuse dashboard
3. In n8n, create new credentials using the "Langfuse API (Basic Auth)" credential type
4. Enter your:
   - **Base URL**: Your Langfuse instance URL (e.g., https://langfuse.nodesk.tech)
   - **Public Key**: Your Langfuse public key (used as username)
   - **Secret Key**: Your Langfuse secret key (used as password)

## Compatibility

This node is compatible with n8n version 1.0.0 and above.

## Usage

### Langfuse Prompt Node

1. Add the Langfuse Prompt node to your workflow
2. Configure your Langfuse credentials
3. Set the **Prompt Name** to fetch from Langfuse
4. Optionally set a **Prompt Label** (defaults to "production")
5. Provide **Variables** as JSON for template rendering

The node will:
- Fetch the prompt template from Langfuse
- Render the template with your provided variables using `{{variable}}` syntax
- Return the rendered prompt along with metadata

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Langfuse documentation](https://langfuse.com/docs)

## Version history

### 0.1.0

Initial release with Langfuse Prompt node functionality.
