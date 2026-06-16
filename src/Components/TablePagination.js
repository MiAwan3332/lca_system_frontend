import { Button, ButtonGroup, Select } from "@chakra-ui/react";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import Cookies from "js-cookie";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function TablePagination({
  pagination,
  setLimitFilter,
  setPageFilter,
  method,
  payload = {},
}) {
  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));
  const {
    totalDocs,
    limit,
    totalPages,
    page,
    pagingCounter,
    hasPrevPage,
    hasNextPage,
    prevPage,
    nextPage,
  } = pagination;
  const dispatch = useDispatch();

  const handlePage = (page) => {
    dispatch(setPageFilter(page));
    dispatch(method({ authToken, ...payload }));
  };

  const handleLimit = (e) => {
    dispatch(setLimitFilter(e.target.value));
    dispatch(method({ authToken, ...payload }));
  };

  const renderPageButtons = () => {
    if (totalPages < 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1).map((item) => (
        <Button
          key={item}
          onClick={() => handlePage(item)}
          isDisabled={page === item}
          borderRadius={"xl"}
        >
          {item}
        </Button>
      ));
    } else {
      if (page < 3) {
        return Array.from({ length: 5 }, (_, i) => i + 1).map((item) => (
          <Button
            key={item}
            onClick={() => handlePage(item)}
            isDisabled={page === item}
            borderRadius={"xl"}
          >
            {item}
          </Button>
        ));
      } else if (page > totalPages - 2) {
        return (
          <>
            <Button borderRadius={"xl"}>...</Button>
            {Array.from({ length: 5 }, (_, i) => totalPages - 4 + i).map(
              (item) => (
                <Button
                  key={item}
                  onClick={() => handlePage(item)}
                  isDisabled={page === item}
                  borderRadius={"xl"}
                >
                  {item}
                </Button>
              )
            )}
          </>
        );
      } else {
        return (
          <>
            {page !== 3 && (
              <Button borderRadius={"xl"}>...</Button>
            )}
            {Array.from({ length: 5 }, (_, i) => page - 2 + i).map((item) => (
              <Button
                key={item}
                onClick={() => handlePage(item)}
                isDisabled={page === item}
                borderRadius={"xl"}
              >
                {item}
              </Button>
            ))}
            <Button borderRadius={"xl"}>...</Button>
          </>
        );
      }
    }
  };

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-4 my-5 px-2 sm:px-4 lg:px-8 w-full max-w-full overflow-x-auto">
        <div className="flex items-center gap-4">
          <p className="text-md">
            {`${page * limit - limit + 1} - ${
              page * limit > totalDocs ? totalDocs : page * limit
            } of ${totalDocs} records`}
          </p>
          <Select value={limit} onChange={handleLimit} w="24" borderRadius={"xl"} backgroundColor={"white"} cursor={"pointer"}>
            <option value={1}>1</option>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={40}>40</option>
            <option value={50}>50</option>
          </Select>
        </div>
        <ButtonGroup size="md" isAttached variant="outline" backgroundColor={"white"}>
          <Button
            onClick={() => handlePage(1)}
            isDisabled={!hasPrevPage}
            borderRadius={"xl"}
          >
            <ChevronFirst />
          </Button>
          <Button
            onClick={() => handlePage(prevPage)}
            isDisabled={!hasPrevPage}
            borderRadius={"xl"}
          >
            <ChevronLeft />
          </Button>

          {renderPageButtons()}

          <Button
            onClick={() => handlePage(nextPage)}
            isDisabled={!hasNextPage}
            borderRadius={"xl"}
          >
            <ChevronRight />
          </Button>
          <Button
            onClick={() => handlePage(totalPages)}
            isDisabled={!hasNextPage}
            borderRadius={"xl"}
          >
            <ChevronLast />
          </Button>
        </ButtonGroup>
      </div>
    </>
  );
}
