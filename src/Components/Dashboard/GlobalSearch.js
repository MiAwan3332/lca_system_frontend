import React, { useMemo, useState } from "react";
import {
  Input,
  InputGroup,
  InputLeftElement,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  useColorModeValue,
} from "@chakra-ui/react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getVisibleRoutes } from "../../utlls/studentAccess";
import { routes } from "../../routes";

function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const visibleRoutes = useMemo(() => getVisibleRoutes(routes), []);
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("#E0E8EC", "gray.600");
  const popoverBg = useColorModeValue("white", "gray.800");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const primaryText = useColorModeValue("#263238", "#f1f5f9");
  const hoverBg = useColorModeValue("rgba(255, 203, 130, 0.35)", "rgba(255, 203, 130, 0.2)");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visibleRoutes.slice(0, 6);
    return visibleRoutes.filter((route) =>
      route.name.toLowerCase().includes(q)
    );
  }, [query, visibleRoutes]);

  const handleSelect = (path) => {
    navigate(path);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <Popover
      isOpen={isOpen && results.length > 0}
      onClose={() => setIsOpen(false)}
      placement="bottom-start"
      matchWidth
    >
      <PopoverTrigger>
        <InputGroup size="sm" maxW={{ base: "140px", sm: "200px", md: "260px" }}>
          <InputLeftElement pointerEvents="none">
            <Search size={16} color="#94a3b8" />
          </InputLeftElement>
          <Input
            placeholder="Quick search..."
            borderRadius="xl"
            bg={bg}
            borderColor={border}
            color={primaryText}
            _placeholder={{ color: mutedText }}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />
        </InputGroup>
      </PopoverTrigger>
      <PopoverContent borderRadius="xl" borderColor={border} bg={popoverBg} shadow="lg">
        <PopoverBody p={2}>
          {results.map((route) => (
            <button
              key={route.path}
              type="button"
              className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ color: primaryText }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hoverBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              onClick={() => handleSelect(route.path)}
            >
              <span className="block font-medium">{route.name}</span>
              <span className="block text-xs" style={{ color: mutedText }}>
                {route.path}
              </span>
            </button>
          ))}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

export default GlobalSearch;
