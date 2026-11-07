import axios from "axios";

const EXPORT_PAGE_SIZE = 100;
const DEFAULT_MAX_RECORDS = 10000;

export const fetchAllPaginated = async ({
  url,
  headers,
  params = {},
  maxRecords = DEFAULT_MAX_RECORDS,
}) => {
  const records = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const { data } = await axios.get(url, {
      headers,
      params: { ...params, page, limit: EXPORT_PAGE_SIZE },
    });

    const docs = Array.isArray(data?.docs) ? data.docs : [];
    records.push(...docs);

    if (records.length > maxRecords) {
      throw new Error(
        `Export exceeds the ${maxRecords.toLocaleString()} record safety limit. Narrow the filters and try again.`
      );
    }

    hasNextPage = Boolean(data?.hasNextPage);
    page = Number(data?.nextPage) || page + 1;
  }

  return records;
};
