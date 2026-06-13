import React from "react";
import html2canvas from "html2canvas";
import { Button } from "@chakra-ui/react";
import jsPDF from "jspdf";
import { showErrorPopup } from "../../utlls/errorHandler";

const StudentCard = ({ student, qrCode }) => {
    if (!student) {
        return <p className="text-center text-gray-500 py-6">Student data is not available.</p>;
    }

    const studentName = student.name || "student";
    const safeName = studentName.replace(/\s+/g, "");

    const captureAndDownload = async () => {
        try {
        const cardFront = document.querySelector(".card-front");
        const cardBack = document.querySelector(".card-back");

        if (!cardFront || !cardBack) {
            throw new Error("Student card preview is not ready.");
        }

        // Capture front and back of the card
        const frontCanvas = await html2canvas(cardFront, { scale: 5, useCORS: true });
        const backCanvas = await html2canvas(cardBack, { scale: 5, useCORS: true });

        // Convert canvases to images
        const frontImage = frontCanvas.toDataURL("image/png");
        const backImage = backCanvas.toDataURL("image/png");

        // Create download links for front and back card
        const frontLink = document.createElement("a");
        frontLink.href = frontImage;
        frontLink.download = `card-front-${safeName}-${student._id || "id"}.png`;
        frontLink.click();

        const backLink = document.createElement("a");
        backLink.href = backImage;
        backLink.download = `card-back-${safeName}-${student._id || "id"}.png`;
        backLink.click();
        } catch (error) {
            console.error(error);
            showErrorPopup("Download Failed", error.message || "Failed to download card images.");
        }
    };

    const generatePDF = async () => {
        try {
        const cardFront = document.querySelector(".card-front");
        const cardBack = document.querySelector(".card-back");

        if (!cardFront || !cardBack) {
            throw new Error("Student card preview is not ready.");
        }
    
        // Capture front and back of the card
        const frontCanvas = await html2canvas(cardFront, { scale: 5,useCORS: true });
        const backCanvas = await html2canvas(cardBack, { scale: 5,useCORS: true });
    
        // Get card dimensions from the front canvas
        const cardWidth = frontCanvas.width;
        const cardHeight = frontCanvas.height;
    
        // Initialize jsPDF with custom page size based on card dimensions
        const pdf = new jsPDF({
            orientation: cardWidth > cardHeight ? "landscape" : "portrait",
            unit: "px",
            format: [cardWidth, cardHeight], // Set the page size to match the card size
        });
    
        // Add the front of the card to the first page
        pdf.addImage(frontCanvas.toDataURL("image/png"), "PNG", 0, 0, cardWidth, cardHeight);
    
        // Add a new page for the back of the card
        pdf.addPage([cardWidth, cardHeight]); // Same size as the front page
        pdf.addImage(backCanvas.toDataURL("image/png"), "PNG", 0, 0, cardWidth, cardHeight);
    
        // Save the PDF with the student's name and ID
        pdf.save(`student-card-${safeName}-${student._id || "id"}.pdf`);
        } catch (error) {
            console.error(error);
            showErrorPopup("PDF Failed", error.message || "Failed to generate PDF.");
        }
    };

    return (
        <>
            <div style={{ justifyContent: "center", alignItems: "center", display: "flex" }}>
                <div className="card-front" style={{ display: "grid", width: "288px" }}>
                    <div className="relative w-72 h-56 bg-black">
                        <img src="/logo_dark.svg" className="w-60 mx-auto p-6 mt-10" alt="random" />
                    </div>
                    <div className="relative w-72 h-20 bg-white">
                        <img
                            src={student.image || "/17698878.jpg"}
                            style={{ border: "4px solid goldenrod" }}
                            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36"
                            alt="Student"
                        />
                    </div>
                    <div className="relative w-72 h-48 p-5 bg-white">
                        <table style={{ textAlign: "left" }}>
                            <tbody>
                                <tr>
                                    <th>Name:</th>
                                    <td>
                                        <u>{student.name || "N/A"}</u>
                                    </td>
                                </tr>
                                <tr>
                                    <th>S/O:</th>
                                    <td>
                                        <u>{student.father_name || "N/A"}</u>
                                    </td>
                                </tr>
                                <tr>
                                    <th>Batch:</th>
                                    <td>
                                        <u>{student?.batch?.name || "N/A"}</u>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="w-72 h-9 p-.5" style={{ backgroundColor: "#FCB436" }}>
                        <p className="text-center text-black font-bold">
                            0331-000-111-0 / 0333-9800938
                        </p>
                    </div>
                </div>
                <div
                    className="card-back ml-4"
                    style={{ display: "grid", justifyContent: "center", width: "288px", marginTop: "-1px" }}
                >
                    <div className="relative w-72 h-16 bg-black p-2">
                        <h2
                            style={{ color: "#FCB436", textAlign: "center" }}
                            className="font-bold text-xl"
                        >
                            LAHORE CSS ACADEMY
                        </h2>
                        <p
                            style={{ color: "white", textAlign: "center" }}
                            className="text-xs"
                        >
                            WE GO ACHIEVING
                        </p>
                    </div>
                    <div className="relative w-72 h-36 p-10 bg-white">
                        <table style={{ textAlign: "center" }}>
                            <tbody>
                                <tr>
                                    <th>Issued on:</th>
                                    <td>
                                        <u>{new Date().toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').join('-')}</u>
                                    </td>
                                </tr>
                                <tr>
                                    <th>Valid Till:</th>
                                    <td>
                                        <u>
                                            {student?.batch?.enddate
                                                ? new Date(student.batch.enddate)
                                                    .toLocaleDateString("en-GB", {
                                                        year: "numeric",
                                                        month: "2-digit",
                                                        day: "2-digit",
                                                    })
                                                    .split("/")
                                                    .join("-")
                                                : "N/A"}
                                        </u>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="w-72 h-9 p-.5" style={{ backgroundColor: "#FCB436" }}>
                        <p className="text-center text-black font-bold text-xl">
                            INSTRUCTIONS
                        </p>
                    </div>
                    <div className="relative w-72 h-64 bg-white" style={{ paddingTop: "5px", overflow: "hidden" }}>
                        <div style={{
                            fontSize: "12px",
                            fontFamily: "calibri",
                            listStyleType: "decimal",
                            padding: "20px",
                        }}>
                            <h6>1. This card is property of Lahore CSS Academy.</h6>
                            <h6>2. This card is for personal use only and is not</h6>
                            <h6 style={{ marginLeft: "13px" }}>transferable.</h6>
                            <h6>3. If found please return to the below address.</h6>
                        </div>

                        <div className="absolute bottom-1 left-1" style={{ paddingBottom: "20px" }}>
                            <div
                            dangerouslySetInnerHTML={{ __html: qrCode || "" }}
                            style={{ width: "128px", height: "128px" }}
                        />
                        </div>
                        <div className="absolute bottom-2 right-2 text-right">
                            <hr className="border-t-2 border-black mb-1" />
                            <span className="font-semibold">Issuing Authority</span>
                        </div>
                    </div>
                    <div className="w-72 h-9 p-.5" style={{ backgroundColor: "#FCB436" }}>
                        <p style={{
                            fontSize: "11px",
                            fontFamily: "calibri",
                            textAlign: "center",
                            color: "black",
                            fontWeight: "bold",
                            padding: "6px",
                        }}>
                            13- Sher Shah, New Garden Town, Barkat Market, Lahore
                        </p>
                    </div>
                </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
                <Button
                    marginTop={"0.75rem"}
                    marginBottom={"0.75rem"}
                    borderRadius={"0.75rem"}
                    backgroundColor={"#FFCB82"}
                    color={"#85652D"}
                    _hover={{
                        backgroundColor: "#FCB436",
                        color: "#654E26",
                    }}
                    fontWeight={"500"}
                    type="submit"
                    loadingText="Saving"
                    onClick={captureAndDownload}
                >
                    Download Card Images
                </Button>
                <Button
                    marginTop={"0.75rem"}
                    marginBottom={"0.75rem"}
                    marginLeft={"1rem"}
                    borderRadius={"0.75rem"}
                    backgroundColor={"#FFCB82"}
                    color={"#85652D"}
                    _hover={{
                        backgroundColor: "#FCB436",
                        color: "#654E26",
                    }}
                    fontWeight={"500"}
                    type="button"
                    loadingText="Generating PDF"
                    onClick={generatePDF}
                >
                    Download PDF
                </Button>
            </div>
        </>
    );
};

export default StudentCard;