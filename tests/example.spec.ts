import { expect, test } from '@playwright/test';

declare const process: { env: Record<string, string | undefined> };

const proxyBaseUrl = process.env.CALCULATOR_PROXY_URL ?? 'http://localhost:8888';
const apiKey = process.env.CALCULATOR_API_KEY ?? 'burgerking';

const operations = [
  { name: 'add', backendPort: 8081, a: 2, b: 4, expected: 6 },
  { name: 'subtract', backendPort: 8082, a: 10, b: 4, expected: 6 },
  { name: 'multiply', backendPort: 8083, a: 3, b: 7, expected: 21 },
  { name: 'divide', backendPort: 8084, a: 20, b: 4, expected: 5 },
] as const;

test.describe('calculator API', () => {
  for (const operation of operations) {
    test(`${operation.name} returns the same response directly and through the proxy`, async ({ request }) => {
      const path = `/${operation.name}?a=${operation.a}&b=${operation.b}`;
      const directResponse = await request.get(`http://localhost:${operation.backendPort}${path}`);
      const proxyResponse = await request.get(`${proxyBaseUrl}${path}`, {
        headers: { 'X-API-Key': apiKey },
      });

      expect(directResponse.status()).toBe(200);
      expect(proxyResponse.status()).toBe(directResponse.status());

      const directBody = await directResponse.json();
      const proxyBody = await proxyResponse.json();

      expect(directBody.result).toBe(operation.expected);
      expect(proxyBody).toEqual(directBody);
    });
  }

  test('rejects requests without the API key', async ({ request }) => {
    const response = await request.get(`${proxyBaseUrl}/add?a=2&b=4`);

    expect(response.status()).toBe(403);
  });

  test('rejects requests with an invalid API key', async ({ request }) => {
    const response = await request.get(`${proxyBaseUrl}/add?a=2&b=4`, {
      headers: { 'X-API-Key': 'invalid-key' },
    });

    expect(response.status()).toBe(403);
  });

  test('validates required query parameters through the proxy', async ({ request }) => {
    const response = await request.get(`${proxyBaseUrl}/add?a=2`, {
      headers: { 'X-API-Key': apiKey },
    });

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      error_message: {
        error: 'Both "a" and "b" query parameters are required',
        input: { a: '2', b: null },
      },
    });
  });

  test('prevents division by zero through the proxy', async ({ request }) => {
    const response = await request.get(`${proxyBaseUrl}/divide?a=20&b=0`, {
      headers: { 'X-API-Key': apiKey },
    });

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      error_message: {
        error: 'Cannot divide by zero',
        input: { a: 20, b: 0 },
      },
    });
  });
});
