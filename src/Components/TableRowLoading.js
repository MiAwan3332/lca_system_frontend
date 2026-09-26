import React from "react";
import { Tr, Td } from "@chakra-ui/react";
import LcaLogoLoading from "./LcaLogoLoading";

function TableRowLoading({ nOfColumns = 4, actions = ["w-20", "w-20"] }) {
  const colSpan = Number(nOfColumns) + (actions?.length ? 1 : 0);

  return (
    <Tr>
      <Td colSpan={colSpan} py={6}>
        <LcaLogoLoading size="sm" label="Loading" />
      </Td>
    </Tr>
  );
}

export default TableRowLoading;
