import React from "react";
import { Text } from "@chakra-ui/react";
import { Download, FileUp, Plus, PenLine } from "lucide-react";

const METHODS = [
  {
    key: "manual",
    title: "Add Manually",
    description:
      "Create one MCQ at a time using the form. Best for a few questions or quick edits.",
    icon: PenLine,
    actionLabel: "Add Single MCQ",
    accent: "hover:border-[#FFCB82] hover:bg-[#FFCB82]/10",
    buttonClass:
      "bg-white hover:bg-[#FFCB82] hover:text-[#85652D] border border-[#E0E8EC] hover:border-[#FFCB82]",
    iconBg: "bg-[#FFCB82]/30 text-[#85652D]",
  },
  {
    key: "excel",
    title: "Import from Excel",
    description:
      "Upload a spreadsheet to add many MCQs at once. Supports .xlsx, .xls, and .csv files.",
    icon: FileUp,
    actionLabel: "Import Excel",
    accent: "hover:border-[#7AEF85] hover:bg-[#7AEF85]/10",
    buttonClass:
      "bg-white hover:bg-[#7AEF85] hover:text-[#257947] border border-[#E0E8EC] hover:border-[#7AEF85]",
    iconBg: "bg-[#7AEF85]/30 text-[#257947]",
  },
  {
    key: "template",
    title: "Download Template",
    description:
      "Get the sample Excel file with the correct columns and example rows before bulk import.",
    icon: Download,
    actionLabel: "Sample Template",
    accent: "hover:border-[#82B4FF] hover:bg-[#82B4FF]/10",
    buttonClass:
      "bg-white hover:bg-[#82B4FF]/20 hover:text-[#1E4A7A] border border-[#E0E8EC] hover:border-[#82B4FF]",
    iconBg: "bg-[#82B4FF]/30 text-[#1E4A7A]",
  },
];

function McqAddMethods({ onAddManual, onImportExcel, onDownloadTemplate }) {
  const handlers = {
    manual: onAddManual,
    excel: onImportExcel,
    template: onDownloadTemplate,
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Plus size={20} className="text-[#85652D]" />
        <Text fontWeight="semibold" fontSize="md">
          Ways to Add MCQs
        </Text>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {METHODS.map((method) => {
          const Icon = method.icon;
          return (
            <div
              key={method.key}
              className={`bg-white rounded-xl border border-[#E0E8EC] p-5 flex flex-col gap-3 transition-colors duration-300 ${method.accent}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 ${method.iconBg}`}>
                  <Icon size={22} />
                </div>
                <div className="min-w-0">
                  <Text fontWeight="semibold" fontSize="sm">
                    {method.title}
                  </Text>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    {method.description}
                  </Text>
                </div>
              </div>
              <button
                type="button"
                className={`w-full font-medium pl-[14px] pr-[18px] py-[10px] rounded-xl flex gap-1.5 justify-center items-center transition-colors duration-300 ${method.buttonClass}`}
                onClick={handlers[method.key]}
              >
                <Icon size={18} />
                {method.actionLabel}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default McqAddMethods;
