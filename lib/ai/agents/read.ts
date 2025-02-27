const JINA_URL = `https://r.jina.ai/`;

export const readWebpageContent = async (url: string) => {
  console.log(`Reading webpage: ${url}`);
  const response = await fetch(`${JINA_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      'x-api-key': process.env.JINA_API_KEY!,
    },
  });
  if (!response.ok) {
    console.log(`Error reading webpage status: ${response.statusText} url: ${url}`);
    return '';
  }
  const text = await response.text();
  return text;
};
