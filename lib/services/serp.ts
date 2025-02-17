interface SearchQuery {
  q: string;
  location?: string;
  gl?: string;
  num?: number;
  tbs?: string;
}

export const serpSearch = async (
  queries: string[],
  countryCode: string = 'us',
  city?: string,
): Promise<any> => {
  const searchQueries: SearchQuery[] = queries.map((q) => ({
    q,
    gl: countryCode.toLowerCase(),
    num: 10,
    tbs: 'qdr:y',
    ...(city && { location: city }),
  }));

  const headers = new Headers({
    'X-API-KEY': process.env.SERPER_API_KEY!,
    'Content-Type': 'application/json',
  });

  const requestOptions = {
    method: 'POST',
    headers,
    body: JSON.stringify(searchQueries),
    redirect: 'follow' as RequestRedirect,
  };

  try {
    const response = await fetch(
      'https://google.serper.dev/search',
      requestOptions,
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Serper API error:', error);
    throw error;
  }
};
