import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import jsPDF from "jspdf";
import { Download, FileDown, Printer } from "lucide-react";
import { showErrorPopup } from "../../utlls/errorHandler";
import { getMediaUrl } from "../../utlls/useful.js";

const GOLD = "#F5B942";
const GOLD_SOFT = "#FFE6A8";
const GOLD_DARK = "#7A5A22";
const INK = "#141820";
const MUTED = "#5C6570";
const CARD_W = 340;
const CARD_H = 540;

const formatDate = (value) => {
  if (!value) return "N/A";
  try {
    return new Date(value)
      .toLocaleDateString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .split("/")
      .join("-");
  } catch {
    return "N/A";
  }
};

const DetailChip = ({ label, value }) => (
  <div
    style={{
      background: "linear-gradient(180deg, #FFFFFF 0%, #FFF9EF 100%)",
      border: "1px solid #F0E0B8",
      borderRadius: 12,
      padding: "9px 11px",
      minHeight: 52,
    }}
  >
    <div
      style={{
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: GOLD_DARK,
        marginBottom: 4,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: INK,
        lineHeight: 1.3,
        wordBreak: "break-word",
      }}
    >
      {value || "N/A"}
    </div>
  </div>
);

const StudentCard = ({ student, qrCode }) => {
  const frontRef = useRef(null);
  const backRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [makingPdf, setMakingPdf] = useState(false);
  const [printing, setPrinting] = useState(false);

  if (!student) {
    return (
      <p className="text-center text-gray-500 py-6">
        Student data is not available.
      </p>
    );
  }

  const studentName = student.name || "student";
  const safeName = studentName.replace(/\s+/g, "-").toLowerCase();
  const photoUrl = getMediaUrl(student.image) || "/17698878.jpg";
  const issuedOn = formatDate(new Date());
  const validTill = formatDate(
    student?.batch?.enddate || student?.batch?.end_date
  );
  const rollNo = student.roll_number || "—";
  const cnic = String(student.cnic || "").trim() || "N/A";

  const captureSide = async (node) =>
    html2canvas(node, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

  const captureAndDownload = async () => {
    if (!frontRef.current || !backRef.current || downloading) return;
    setDownloading(true);
    try {
      const frontCanvas = await captureSide(frontRef.current);
      const backCanvas = await captureSide(backRef.current);

      const frontLink = document.createElement("a");
      frontLink.href = frontCanvas.toDataURL("image/png");
      frontLink.download = `card-front-${safeName}.png`;
      frontLink.click();

      const backLink = document.createElement("a");
      backLink.href = backCanvas.toDataURL("image/png");
      backLink.download = `card-back-${safeName}.png`;
      backLink.click();
    } catch (error) {
      console.error(error);
      showErrorPopup(
        "Download Failed",
        error.message || "Failed to download card images."
      );
    } finally {
      setDownloading(false);
    }
  };

  const generatePDF = async () => {
    if (!frontRef.current || !backRef.current || makingPdf) return;
    setMakingPdf(true);
    try {
      const frontCanvas = await captureSide(frontRef.current);
      const backCanvas = await captureSide(backRef.current);
      const width = frontCanvas.width;
      const height = frontCanvas.height;

      const pdf = new jsPDF({
        orientation: width > height ? "landscape" : "portrait",
        unit: "px",
        format: [width, height],
      });

      pdf.addImage(
        frontCanvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        width,
        height
      );
      pdf.addPage([width, height]);
      pdf.addImage(
        backCanvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        width,
        height
      );
      pdf.save(`student-card-${safeName}.pdf`);
    } catch (error) {
      console.error(error);
      showErrorPopup("PDF Failed", error.message || "Failed to generate PDF.");
    } finally {
      setMakingPdf(false);
    }
  };

  const printCard = async () => {
    if (!frontRef.current || !backRef.current || printing) return;
    setPrinting(true);
    try {
      const frontCanvas = await captureSide(frontRef.current);
      const backCanvas = await captureSide(backRef.current);
      const frontImage = frontCanvas.toDataURL("image/png");
      const backImage = backCanvas.toDataURL("image/png");

      const printWindow = window.open("", "_blank", "width=900,height=700");
      if (!printWindow) {
        throw new Error(
          "Pop-up blocked. Allow pop-ups to print the student card."
        );
      }

      printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>Student Card — ${studentName}</title>
    <style>
      @page { size: auto; margin: 12mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 16px;
        font-family: "Segoe UI", Helvetica, Arial, sans-serif;
        background: #fff;
        color: #1a202c;
      }
      h1 {
        font-size: 14px;
        margin: 0 0 16px;
        text-align: center;
        letter-spacing: 0.04em;
      }
      .pages {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        justify-content: center;
        align-items: flex-start;
      }
      .side { text-align: center; }
      .label {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #718096;
        margin-bottom: 8px;
      }
      img {
        width: 340px;
        max-width: 100%;
        height: auto;
        border-radius: 16px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.14);
      }
      @media print {
        body { padding: 0; }
        h1 { display: none; }
        img { box-shadow: none; }
      }
    </style>
  </head>
  <body>
    <h1>LCA Student Card — ${studentName}</h1>
    <div class="pages">
      <div class="side">
        <div class="label">Front</div>
        <img src="${frontImage}" alt="Card front" />
      </div>
      <div class="side">
        <div class="label">Back</div>
        <img src="${backImage}" alt="Card back" />
      </div>
    </div>
    <script>
      const images = Array.from(document.images);
      Promise.all(
        images.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
              })
        )
      ).then(() => {
        setTimeout(() => {
          window.focus();
          window.print();
        }, 200);
      });
    </script>
  </body>
</html>`);
      printWindow.document.close();
    } catch (error) {
      console.error(error);
      showErrorPopup(
        "Print Failed",
        error.message || "Failed to print student card."
      );
    } finally {
      setPrinting(false);
    }
  };

  const cardShell = {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 22,
    overflow: "hidden",
    position: "relative",
    background: "#FFFFFF",
    boxShadow:
      "0 22px 48px rgba(20, 24, 32, 0.22), 0 0 0 1px rgba(245, 185, 66, 0.35)",
    fontFamily:
      '"Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
  };

  const instructions = [
    "This card is the property of Learning & Career Academy.",
    "For personal use only — not transferable.",
    "If found, return to the address below.",
  ];

  return (
    <VStack spacing={6} align="stretch" pb={2}>
      <HStack
        spacing={7}
        justify="center"
        align="flex-start"
        flexWrap="wrap"
        px={2}
      >
        {/* FRONT */}
        <Box>
          <Text
            fontSize="xs"
            fontWeight="bold"
            letterSpacing="0.14em"
            color="gray.500"
            mb={2}
            textAlign="center"
          >
            FRONT
          </Text>
          <div ref={frontRef} className="card-front" style={cardShell}>
            {/* Outer gold frame */}
            <div
              style={{
                position: "absolute",
                inset: 8,
                borderRadius: 16,
                border: `1.5px solid ${GOLD}`,
                pointerEvents: "none",
                zIndex: 5,
                opacity: 0.55,
              }}
            />

            {/* Header */}
            <div
              style={{
                height: 132,
                background:
                  "linear-gradient(145deg, #0F1115 0%, #1C1F26 42%, #2A2418 100%)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  width: 180,
                  height: 180,
                  borderRadius: "50%",
                  right: -40,
                  top: -50,
                  background:
                    "radial-gradient(circle, rgba(245,185,66,0.35) 0%, transparent 70%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  left: -30,
                  bottom: -40,
                  background:
                    "radial-gradient(circle, rgba(245,185,66,0.18) 0%, transparent 70%)",
                }}
              />
              {/* Diagonal foil stripe */}
              <div
                style={{
                  position: "absolute",
                  width: 40,
                  height: 220,
                  right: 70,
                  top: -30,
                  transform: "rotate(28deg)",
                  background:
                    "linear-gradient(180deg, transparent, rgba(255,230,168,0.22), transparent)",
                }}
              />

              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  padding: "18px 20px 0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: `linear-gradient(145deg, ${GOLD}, #E09A20)`,
                        color: "#1A1408",
                        fontWeight: 900,
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(245,185,66,0.4)",
                      }}
                    >
                      LCA
                    </div>
                    <div>
                      <div
                        style={{
                          color: GOLD,
                          fontWeight: 800,
                          fontSize: 13,
                          letterSpacing: "0.04em",
                        }}
                      >
                        Learning & Career
                      </div>
                      <div
                        style={{
                          color: "#C5CDD8",
                          fontSize: 9,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          marginTop: 1,
                        }}
                      >
                        Academy
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_SOFT} 100%)`,
                    color: GOLD_DARK,
                    fontSize: 9,
                    fontWeight: 900,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "7px 11px",
                    borderRadius: 999,
                    boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
                  }}
                >
                  Student ID
                </div>
              </div>

              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  marginTop: 16,
                  padding: "0 20px",
                  color: "#9AA3B2",
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                Official Identity Card
              </div>
            </div>

            {/* Photo + identity block */}
            <div
              style={{
                display: "flex",
                gap: 14,
                padding: "0 18px",
                marginTop: -36,
                position: "relative",
                zIndex: 2,
              }}
            >
              <div
                style={{
                  width: 102,
                  height: 122,
                  borderRadius: 14,
                  padding: 3,
                  background: `linear-gradient(160deg, ${GOLD}, #C9891A)`,
                  boxShadow: "0 12px 24px rgba(122, 90, 34, 0.35)",
                  flexShrink: 0,
                }}
              >
                <img
                  src={photoUrl}
                  alt={studentName}
                  crossOrigin="anonymous"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 11,
                    background: "#EDF2F7",
                    display: "block",
                  }}
                />
              </div>

              <div style={{ flex: 1, paddingTop: 42 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: INK,
                    lineHeight: 1.2,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {student.name || "N/A"}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background:
                      "linear-gradient(90deg, #1C1F26 0%, #2E2830 100%)",
                    color: GOLD,
                    borderRadius: 999,
                    padding: "5px 11px",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: GOLD,
                      display: "inline-block",
                    }}
                  />
                  ROLL {rollNo}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 11,
                    color: MUTED,
                    fontWeight: 600,
                  }}
                >
                  S/O {student.father_name || "N/A"}
                </div>
              </div>
            </div>

            {/* Detail chips grid */}
            <div
              style={{
                padding: "16px 18px 12px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              <DetailChip label="Batch" value={student?.batch?.name} />
              <DetailChip label="Phone" value={student.phone} />
              <div style={{ gridColumn: "1 / -1" }}>
                <DetailChip label="CNIC" value={cnic} />
              </div>
            </div>

            {/* Decorative divider */}
            <div
              style={{
                margin: "0 18px 10px",
                height: 2,
                borderRadius: 2,
                background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
              }}
            />

            <div
              style={{
                textAlign: "center",
                fontSize: 9,
                color: MUTED,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontWeight: 700,
                marginBottom: 46,
              }}
            >
              Authenticated Student Member
            </div>

            {/* Footer */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(90deg, #C9891A 0%, ${GOLD} 45%, ${GOLD_SOFT} 55%, ${GOLD} 100%)`,
                padding: "12px 14px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#1A1408",
                  letterSpacing: "0.03em",
                }}
              >
                0331-000-111-0 · 0333-9800938
              </div>
            </div>
          </div>
        </Box>

        {/* BACK */}
        <Box>
          <Text
            fontSize="xs"
            fontWeight="bold"
            letterSpacing="0.14em"
            color="gray.500"
            mb={2}
            textAlign="center"
          >
            BACK
          </Text>
          <div ref={backRef} className="card-back" style={cardShell}>
            <div
              style={{
                position: "absolute",
                inset: 8,
                borderRadius: 16,
                border: `1.5px solid ${GOLD}`,
                pointerEvents: "none",
                zIndex: 5,
                opacity: 0.55,
              }}
            />

            <div
              style={{
                background:
                  "linear-gradient(145deg, #0F1115 0%, #1C1F26 55%, #2A2418 100%)",
                padding: "20px 18px 18px",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at 50% 0%, rgba(245,185,66,0.25), transparent 55%)",
                }}
              />
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  fontSize: 12,
                  fontWeight: 900,
                  color: GOLD,
                  letterSpacing: "0.16em",
                }}
              >
                LEARNING & CAREER ACADEMY
              </div>
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  marginTop: 6,
                  fontSize: 10,
                  color: "#A8B0BD",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                We Go Achieving
              </div>
            </div>

            {/* Validity strip */}
            <div style={{ padding: "16px 18px 8px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    background: "#141820",
                    borderRadius: 12,
                    padding: "12px 12px",
                    color: "#FFF",
                  }}
                >
                  <div
                    style={{
                      fontSize: 8,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: GOLD,
                      fontWeight: 800,
                      marginBottom: 4,
                    }}
                  >
                    Issued On
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{issuedOn}</div>
                </div>
                <div
                  style={{
                    background: `linear-gradient(145deg, ${GOLD} 0%, #E09A20 100%)`,
                    borderRadius: 12,
                    padding: "12px 12px",
                    color: "#1A1408",
                  }}
                >
                  <div
                    style={{
                      fontSize: 8,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      fontWeight: 800,
                      marginBottom: 4,
                      opacity: 0.8,
                    }}
                  >
                    Valid Till
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>{validTill}</div>
                </div>
              </div>
            </div>

            <div
              style={{
                margin: "6px 18px 0",
                textAlign: "center",
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: "0.18em",
                color: GOLD_DARK,
              }}
            >
              CARD INSTRUCTIONS
            </div>

            <div style={{ padding: "10px 18px 4px" }}>
              {instructions.map((text, index) => (
                <div
                  key={text}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    marginBottom: 8,
                    background: index % 2 === 0 ? "#FFF9EF" : "#FFFFFF",
                    border: "1px solid #F0E0B8",
                    borderRadius: 10,
                    padding: "8px 10px",
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "#1C1F26",
                      color: GOLD,
                      fontSize: 10,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: MUTED,
                      lineHeight: 1.4,
                      fontWeight: 600,
                    }}
                  >
                    {text}
                  </div>
                </div>
              ))}
            </div>

            {/* QR + seal */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 18px 58px",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 14,
                  border: `2px solid ${GOLD}`,
                  background: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 16px rgba(122,90,34,0.15)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: 88,
                    height: 88,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  dangerouslySetInnerHTML={{ __html: qrCode || "" }}
                />
              </div>

              <div style={{ textAlign: "center", flex: 1 }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    margin: "0 auto 8px",
                    borderRadius: "50%",
                    border: `2px dashed ${GOLD}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "radial-gradient(circle, #FFF9EF 0%, #FFFFFF 70%)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 900,
                        color: GOLD_DARK,
                        letterSpacing: "0.06em",
                      }}
                    >
                      LCA
                    </div>
                    <div
                      style={{
                        fontSize: 7,
                        color: MUTED,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        marginTop: 2,
                      }}
                    >
                      Verified
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    borderTop: "2px solid #1C1F26",
                    width: 110,
                    margin: "0 auto 6px",
                  }}
                />
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: INK,
                  }}
                >
                  Issuing Authority
                </div>
                <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>
                  Administration Office
                </div>
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(90deg, #C9891A 0%, ${GOLD} 45%, ${GOLD_SOFT} 55%, ${GOLD} 100%)`,
                padding: "11px 12px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  color: "#1A1408",
                  lineHeight: 1.35,
                }}
              >
                13-Sher Shah, New Garden Town, Barkat Market, Lahore
              </div>
            </div>
          </div>
        </Box>
      </HStack>

      <HStack justify="center" spacing={3} flexWrap="wrap">
        <Button
          leftIcon={<Printer size={16} />}
          borderRadius="0.75rem"
          backgroundColor="#82B4FF"
          color="#2D4185"
          _hover={{ backgroundColor: "#74A0E3", color: "#223163" }}
          fontWeight="500"
          onClick={printCard}
          isLoading={printing}
          loadingText="Preparing"
        >
          Print Card
        </Button>
        <Button
          leftIcon={<Download size={16} />}
          borderRadius="0.75rem"
          backgroundColor="#FFCB82"
          color="#85652D"
          _hover={{ backgroundColor: "#FCB436", color: "#654E26" }}
          fontWeight="500"
          onClick={captureAndDownload}
          isLoading={downloading}
          loadingText="Preparing"
        >
          Download Card Images
        </Button>
        <Button
          leftIcon={<FileDown size={16} />}
          borderRadius="0.75rem"
          backgroundColor="#FFCB82"
          color="#85652D"
          _hover={{ backgroundColor: "#FCB436", color: "#654E26" }}
          fontWeight="500"
          onClick={generatePDF}
          isLoading={makingPdf}
          loadingText="Generating"
        >
          Download PDF
        </Button>
      </HStack>
    </VStack>
  );
};

export default StudentCard;
