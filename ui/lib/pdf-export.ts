import jsPDF from "jspdf"
import type { Message } from "ai"

export function exportChatToPDF(messages: Message[], title = "LLMAO Chat Export") {
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20
  const maxWidth = pageWidth - 2 * margin
  let yPosition = margin

  // Add title
  pdf.setFontSize(20)
  pdf.setFont("helvetica", "bold")
  pdf.text(title, margin, yPosition)
  yPosition += 20

  // Add export date
  pdf.setFontSize(10)
  pdf.setFont("helvetica", "normal")
  pdf.text(`Exported on: ${new Date().toLocaleString()}`, margin, yPosition)
  yPosition += 20

  // Filter out system messages
  const visibleMessages = messages.filter((message) => message.role !== "system")

  visibleMessages.forEach((message, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      pdf.addPage()
      yPosition = margin
    }

    // Add message header
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    const roleText = message.role === "user" ? "You" : "LLMAO"
    pdf.text(`${roleText}:`, margin, yPosition)
    yPosition += 10

    // Add message content
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")

    // Split text to fit within page width
    const lines = pdf.splitTextToSize(message.content, maxWidth)

    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage()
        yPosition = margin
      }
      pdf.text(line, margin, yPosition)
      yPosition += 6
    })

    yPosition += 10 // Add space between messages
  })

  // Save the PDF
  const fileName = `llmao-chat-${new Date().toISOString().split("T")[0]}.pdf`
  pdf.save(fileName)
}
