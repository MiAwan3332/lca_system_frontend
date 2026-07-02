import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import {
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement
} from "@chakra-ui/react";
import { Search, X } from "lucide-react";
import { useDispatch } from "react-redux";
import Cookies from "js-cookie";


const TableSearch = forwardRef(({ setQueryFilter, method, placeholder = "Search...", payload = {} }, ref) => {
  const [authToken] = useState(Cookies.get("authToken"));
  const [searchQuery, setSearchQuery] = useState("");
  const dispatch = useDispatch();

  const runSearch = (query) => {
    dispatch(setQueryFilter(query));
    dispatch(method({ authToken, ...payload }));
  };

  const handleSearch = () => {
    runSearch(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery("");
    runSearch("");
  };

  useEffect(() => {
    setSearchQuery("");
    dispatch(setQueryFilter(""));
  }, []);

  useImperativeHandle(ref, () => ({
    clearSearch
  }));

  return (
    <>
      <InputGroup size="lg" variant="filled" bg="white" w="full">
        <InputLeftElement
          pointerEvents="none"
          color="gray.300"
          fontSize="1.2em"
        >
          <Search />
        </InputLeftElement>
        <Input
          placeholder={placeholder}
          borderRadius="xl"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch(e)}
        />
        <InputRightElement width="2.8rem">
          {searchQuery && (
            <IconButton
              h="calc(100% - 0.9rem)"
              size="md"
              borderRadius={"lg"}
              marginRight={"0.5rem"}
              onClick={() => clearSearch()}
            >
              <X />
            </IconButton>
          )}
        </InputRightElement>
      </InputGroup>
    </>
  );
});

export default TableSearch;
