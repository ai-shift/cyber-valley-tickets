class ApiClient {
	private baseUrl: string;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
	}

	private async handleResponse<TResult>(response: Response): Promise<TResult> {
		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}

		try {
			return await response.json();
		} catch (e) {
			throw new Error("Error parsing the response");
		}
	}

	public async get<TResult = unknown>(
		endpoint: string,
		searchParams?: Record<string, string | number>,
	): Promise<TResult> {
		const url = new URL(endpoint, this.baseUrl);

		if (searchParams) {
			for (const key in searchParams) {
				url.searchParams.append(key, searchParams[key].toString());
			}
		}

		const response = await fetch(url.toString(), {
			method: "GET",
			headers: {
				"Content-type": "application/json",
			},
		});

		return await this.handleResponse<TResult>(response);
	}

	public async mutate<TResult = unknown, TData = Record<string, unknown>>(
		endpoint: string,
		method: "POST" | "PATCH" | "PUT" | "DELETE",
		data?: TData,
	): Promise<TResult> {
		const response = await fetch(`${this.baseUrl}/${endpoint}`, {
			method,
			headers: {
				"Content-type": "application/json",
			},
			body: data && JSON.stringify(data),
		});

		return await this.handleResponse<TResult>(response);
	}
}

export const apiClient = new ApiClient("/");
