import axios from 'axios';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

// Initialize the Secrets Manager client
const secretsManagerClient = new SecretsManagerClient({ region: 'us-east-1' });

export const handler: APIGatewayProxyHandler = async (event) => {
    // Parse the input from the event body
    const { org, project, repo } = JSON.parse(event.body);

    // Retrieve the PAT from AWS Secrets Manager
    const secretName = "azureDevOpsPAT";  // Change to your secret's name
    const secretValueCommand = new GetSecretValueCommand({ SecretId: secretName });
    const secret = await secretsManagerClient.send(secretValueCommand);
    const azureDevOpsPAT = JSON.parse(secret.SecretString).PAT;

    // Azure DevOps API URL
    const apiUrl = `https://dev.azure.com/${org}/${project}/_apis/git/repositories?api-version=6.0`;

    // Headers for Azure DevOps API request
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`:${azureDevOpsPAT}`).toString('base64')}`
    };

    // Repository creation payload
    const data = { "name": repo };

    try {
        // Make the API request
        const response = await axios.post(apiUrl, data, { headers });
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Repository created successfully",
                repositoryUrl: response.data.url
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Failed to create repository", error: error.message })
        };
    }
};
