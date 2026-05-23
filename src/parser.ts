export async function parseResponse(response: Response) {
  const text = await response.text();
  const contentType = response.headers.get('content-type') ?? '';
  let body: unknown = text;
  let bodyParseError: string | undefined;

  if (contentType.includes('application/json') && text) {
    try {
      body = JSON.parse(text);
    } catch (error) {
      bodyParseError = error instanceof Error ? error.message : String(error);
    }
  }


  console.log(`⚡️Status code: ${response.status}`);
  console.log(`⚡️Status text: ${response.statusText}`);
  console.log(`⚡️URL: ${response.url}`);
  console.log(`⚡️Redirected: ${response.redirected}`);
  console.log(`⚡️Type: ${response.type}`);
  console.log('⚡️Headers:', Object.fromEntries(response.headers.entries()));
  console.log('⚡️Body:', body);
  if(bodyParseError) {
    console.log('⛔️️Body parse error:', bodyParseError);
  }

  return;
}
