import useSWR from 'swr';
import { fetcher, apiUrl } from '@/lib/fetcher';
import useSWRImmutable from 'swr/immutable'
import type { UserInfo, ConfigData, ChartData, AppClient, InfoHeaders } from '@/types/user';
import { getInitialData } from '@/lib/initialData';
import { isSafeImportUrl } from '@/lib/urlSafety';

export const useUserInfo = () => {
  const initial = getInitialData();
  
  const { data: response, error, isLoading, isValidating, mutate } = useSWR<{ data: UserInfo; headers: InfoHeaders }>(
    apiUrl('info'),
    fetcher,
    {
      // Don't use fallbackData - we'll handle initial data separately
      // This ensures the fetcher always runs and returns { data, headers } structure
      revalidateIfStale: false,
      revalidateOnMount: true, // Always fetch on mount to get headers
      errorRetryCount: Infinity,
      errorRetryInterval: 5000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 30000,
      dedupingInterval: 5000,
      onError: (error) => {
        console.warn('Failed to fetch user info:', error);
      }
    }
  );

  // Extract data and headers from response
  // Response should always be { data, headers } from fetcher for /info endpoint
  const apiData = response?.data;
  const apiHeaders = response?.headers;
  
  // P5.14: Prefer current API data over the initial Jinja-rendered data so that
  // fresh server-side state (e.g. traffic/expiry changes) is reflected once the
  // fetch resolves. Initial data is only used as a fallback before the first
  // successful API response.
  const data = apiData ?? initial?.user;
  
  // Always use headers from API response (headers are only available from API, not from initial data)
  const headers = apiHeaders;

  const handleRefresh = async () => {
    await mutate();
  };

  // Don't show loading if we have initial data
  const shouldShowLoading = isLoading && !initial?.user;

  return { data, headers, error, isLoading: shouldShowLoading, isValidating, refresh: handleRefresh };
};

export const useConfigData = () => {
  const initialLinksArray = getInitialData()?.links;
  
  // Only use Jinja-rendered data, no network requests.
  // P8.9: Use the centralized isSafeImportUrl helper from urlSafety.ts instead
  // of inline startsWith checks — the helper performs full URL parsing via
  // new URL(), which rejects malformed strings that merely start with a
  // proxy scheme prefix.
  const data: ConfigData | undefined = initialLinksArray && initialLinksArray.length > 0
    ? {
        links: initialLinksArray.filter(link =>
          link && link.length > 0 && isSafeImportUrl(link)
        )
      }
    : undefined;

  return { data };
};

export const useChartData = (
  startTime: Date,
  period: string = "hour",
  shouldFetch: boolean = true
) => {
  const { data: chartData, error: chartError, mutate: chartMutate } = useSWR<ChartData>(
    shouldFetch ? apiUrl(`usage?start=${encodeURIComponent(startTime.toISOString())}&period=${period}`) : null,
    fetcher,
    {
      errorRetryCount: 2,
      errorRetryInterval: 2000,
      revalidateOnFocus: false,
      revalidateOnMount: shouldFetch, // Only fetch on first load if shouldFetch is true
      refreshInterval: 60000,
      dedupingInterval: 5000,
      onError: (error) => {
        console.warn("Failed to fetch chart data:", error);
      },
    }
  );

  return { chartData, chartError, chartRetry: () => { void chartMutate() } };
};

export const useApps = () => {
  const initialAppsArray = getInitialData()?.apps;
  
  // If we have initial data, use it directly without making network requests
  if (initialAppsArray && initialAppsArray.length > 0) {
    return { apps: initialAppsArray, appsError: null, appsLoading: false, appsRetry: undefined };
  }

  // Only make network request if no initial data is available
  const { data, error, isLoading, mutate } = useSWRImmutable<AppClient[]>(
    apiUrl('apps'),
    fetcher,
    {
      errorRetryCount: 2,
      errorRetryInterval: 3000,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      onError: (err) => {
        console.warn('Failed to fetch apps:', err)
      }
    }
  )

  return { apps: data, appsError: error, appsLoading: isLoading, appsRetry: () => { void mutate() } }
}

// Hook to get support URL from useUserInfo headers (no separate fetch needed)
export const useSupportUrl = () => {
  const { headers } = useUserInfo();
  const supportUrl = headers?.['support-url'];
  
  return { supportUrl: supportUrl || null };
};

