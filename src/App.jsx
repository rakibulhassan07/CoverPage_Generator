import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import toast, { Toaster } from 'react-hot-toast';
import "./App.css";
import uiuLogo from "./assets/United_International_University_Monogram.svg.png";

export default function App() {
  const [info, setInfo] = useState({
    studentName: "",
    studentId: "",
    departmentOfStudent: "",
    departmentOfTeacher: "",
    courseName: "",
    assignmentNumber: "",
    section: "",
    teacherName: "",
    submissionDate: "",
  });

  const coverRef = useRef();

  const handleChange = (e) => {
    setInfo({ ...info, [e.target.name]: e.target.value });
  };

  const validateInfo = () => {
    const requiredFields = {
      studentName: "Student Name",
      studentId: "Student ID", 
      courseName: "Course Name",
      assignmentNumber: "Assignment Number",
      teacherName: "Teacher Name",
      submissionDate: "Submission Date"
    };

    const missingFields = Object.keys(requiredFields).filter(
      field => !info[field] || info[field].trim() === ""
    );

    if (missingFields.length > 0) {
      const missingFieldNames = missingFields.map(field => requiredFields[field]);
      toast.error(`Please fill in the following required fields:\n• ${missingFieldNames.join('\n• ')}`, {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          fontSize: '14px',
          maxWidth: '400px',
          whiteSpace: 'pre-line'
        },
      });
      return false;
    }
    return true;
  };

  const handleDownload = async () => {
    // Validate required fields first
    if (!validateInfo()) {
      return;
    }

    const element = coverRef.current;
    
    if (!element) {
      toast.error("Cover page element not found!", {
        duration: 3000,
        position: 'top-center',
      });
      return;
    }

    // Show loading toast
    const loadingToastId = toast.loading('Generating PDF...', {
      position: 'top-center',
    });

    try {
      
      // Show loading state
      const downloadBtn = document.querySelector('.download-btn');
      const originalText = downloadBtn.textContent;
      downloadBtn.textContent = 'Generating PDF...';
      downloadBtn.disabled = true;

      // Get element's actual dimensions
      const rect = element.getBoundingClientRect();
      
      // Enhanced html2canvas options for better quality and proper sizing
      const canvas = await html2canvas(element, {
        scale: 2, // High quality scaling
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: 794, // Exact A4 width in pixels
        height: 1123, // Exact A4 height in pixels
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1200, // Larger window width to prevent layout issues
        windowHeight: 1400, // Larger window height
        logging: false,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          // Ensure proper styling in cloned document
          const clonedElement = clonedDoc.querySelector('.cover-page');
          if (clonedElement) {
            // Reset all transforms and ensure exact sizing
            clonedElement.style.transform = 'none';
            clonedElement.style.transformOrigin = 'top left';
            clonedElement.style.margin = '0';
            clonedElement.style.padding = '75px';
            clonedElement.style.width = '794px';
            clonedElement.style.height = '1123px';
            clonedElement.style.maxWidth = '794px';
            clonedElement.style.maxHeight = '1123px';
            clonedElement.style.minWidth = '794px';
            clonedElement.style.minHeight = '1123px';
            clonedElement.style.display = 'flex';
            clonedElement.style.flexDirection = 'column';
            clonedElement.style.alignItems = 'center';
            clonedElement.style.boxSizing = 'border-box';
            clonedElement.style.overflow = 'hidden';
            clonedElement.style.fontFamily = 'Arial, Helvetica, sans-serif';
            clonedElement.style.position = 'relative';
            
            // Ensure parent containers don't interfere
            const clonedParent = clonedElement.parentElement;
            if (clonedParent) {
              clonedParent.style.width = '794px';
              clonedParent.style.height = '1123px';
              clonedParent.style.overflow = 'hidden';
              clonedParent.style.margin = '0';
              clonedParent.style.padding = '0';
            }
          }
        }
      });

      // Get canvas dimensions
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      const imgData = canvas.toDataURL("image/png", 1.0);
      
      // Create PDF with proper A4 dimensions
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true
      });

      // A4 dimensions in mm
      const pdfWidth = 210;
      const pdfHeight = 297;
      
      // Calculate proper scaling to maintain aspect ratio
      const aspectRatio = canvasWidth / canvasHeight;
      const pdfAspectRatio = pdfWidth / pdfHeight;
      
      let imgWidth = pdfWidth;
      let imgHeight = pdfHeight;
      let offsetX = 0;
      let offsetY = 0;
      
      // Ensure the image fits exactly without extra space
      if (aspectRatio > pdfAspectRatio) {
        // Canvas is wider than PDF - fit to width
        imgHeight = pdfWidth / aspectRatio;
        offsetY = (pdfHeight - imgHeight) / 2;
      } else {
        // Canvas is taller than PDF - fit to height
        imgWidth = pdfHeight * aspectRatio;
        offsetX = (pdfWidth - imgWidth) / 2;
      }
      
      // Add image to PDF with calculated dimensions to eliminate white space
      pdf.addImage(imgData, "PNG", offsetX, offsetY, imgWidth, imgHeight, undefined, 'FAST');
      
      // Add metadata to PDF
      pdf.setProperties({
        title: `Assignment Cover - ${info.courseName || 'Course'}`,
        subject: `Assignment ${info.assignmentNumber || ''} Cover Page`,
        author: info.studentName || 'Student',
        creator: 'UIU Cover Page Generator',
        producer: 'UIU Cover Page Generator'
      });
      
      // Generate filename with current date and student info
      const currentDate = new Date().toISOString().split('T')[0];
      const studentName = info.studentName ? info.studentName.replace(/[^a-zA-Z0-9]/g, '_') : 'Student';
      const courseCode = info.courseName ? info.courseName.replace(/[^a-zA-Z0-9]/g, '_') : 'Course';
      const assignmentNum = info.assignmentNumber || 'Assignment';
      
      const filename = `${studentName}_${courseCode}_Assignment_${assignmentNum}_Cover_${currentDate}.pdf`;
      
      // Save the PDF
      pdf.save(filename);
      
      // Reset button state
      downloadBtn.textContent = originalText;
      downloadBtn.disabled = false;
      
      // Dismiss loading toast and show success message
      toast.dismiss(loadingToastId);
      toast.success(`PDF generated successfully!\nFilename: ${filename}`, {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#dcfce7',
          color: '#16a34a',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          fontSize: '14px',
          maxWidth: '450px',
          whiteSpace: 'pre-line'
        },
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Dismiss loading toast and show error message
      toast.dismiss(loadingToastId);
      toast.error('Error generating PDF. Please try again.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          fontSize: '14px'
        },
      });
      
      // Reset button state on error
      const downloadBtn = document.querySelector('.download-btn');
      downloadBtn.textContent = 'Download as PDF';
      downloadBtn.disabled = false;
    }
  };

  return (
    <div className="app-root">
      <Toaster />
      <div className="panel">
        <div className="form-panel">
          <h2>Cover Page Inputs</h2>
          <div className="form-grid">
             <label>
              Assignment Number
              <input name="assignmentNumber" value={info.assignmentNumber} onChange={handleChange} />
            </label>
            <label>
              Course
              <input name="courseName" value={info.courseName} onChange={handleChange} />
            </label>
            <label>
              Student Name
              <input name="studentName" value={info.studentName} onChange={handleChange} />
            </label>
            <label>
              Student ID
              <input name="studentId" value={info.studentId} onChange={handleChange} />
            </label>
             <label>
              Section
              <input name="section" value={info.section} onChange={handleChange} />
            </label>
            <label>
              Department of Student
              <input 
                name="departmentOfStudent" 
                value={info.departmentOfStudent} 
                onChange={handleChange}
                list="departments"
                placeholder="Select or type department"
              />
            </label>
            
           
            <label>
              Submitted To
              <input name="teacherName" value={info.teacherName} onChange={handleChange} />
            </label>

            <label>
              Department of Teacher
              <input 
                name="departmentOfTeacher" 
                value={info.departmentOfTeacher} 
                onChange={handleChange}
                list="departments"
                placeholder="Select or type department"
              />
            </label>

            <datalist id="departments">
              <option value="CSE">Computer Science and Engineering</option>
              <option value="EEE">Electrical and Electronic Engineering</option>
              <option value="BBA">Bachelor of Business Administration</option>
              <option value="CE">Civil Engineering</option>
              <option value="ME">Mechanical Engineering</option>
              <option value="ECE">Electronics and Communication Engineering</option>
              <option value="IT">Information Technology</option>
              <option value="MBA">Master of Business Administration</option>
              <option value="Physics">Physics</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Economics">Economics</option>
              <option value="English">English</option>
              <option value="Law">Law</option>
            </datalist>

            <label>
              Submission Date
              <input type="date" name="submissionDate" value={info.submissionDate} onChange={handleChange} />
            </label>
          </div>

          <div className="actions">
            <button onClick={handleDownload} className="download-btn">
              📄 Generate PDF
            </button>
            <div className="validation-info">
              <small>All fields are required for PDF generation</small>
            </div>
          </div>
        </div>

        <div className="preview-panel">
          <div className="cover-page" ref={coverRef}>
            {/* Corner decorative lines - matching the image */}
            <div className="corner-lines">
              <div className="corner-line top-left-vertical"></div>
              <div className="corner-line top-left-horizontal1"></div>
              <div className="corner-line top-left-horizontal2"></div>
              <div className="corner-line top-left-horizontal3"></div>
            </div>

            {/* UIU Logo - centered at top */}
            <div className="logo-section">
              <img
                src={uiuLogo}
                alt="UIU Logo"
                className="uiu-logo"
              />
            </div>

            {/* University Name */}
            <h1 className="university-title">United International University</h1>

            {/* Watermark - large UIU logo */}
            <div className="watermark-logo">
              <img
                src={uiuLogo}
                alt="UIU Logo Watermark"
                className="watermark-uiu-logo"
              />
            </div>

            {/* Information List - exactly matching the image layout */}
            <div className="info-section">
              <div className="info-row">
                <span className="info-label">Assignment No :</span>
                <span className="info-value">{info.assignmentNumber}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Course Title :</span>
                <div className="info-details">
                  <div className="detail-item">
                    <span className="arrow">➜</span>
                    <span className="detail-value">{info.courseName}</span>
                  </div>
                </div>
              </div>
              <div className="info-row submission-section">
                <span className="info-label">Submitted by :</span>
                <div className="info-details">
                  <div className="detail-item">
                    <span className="arrow">➜</span>
                    <span className="detail-value">{info.studentName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="arrow">➜</span>
                    <span className="detail-value">ID : {info.studentId }</span>
                  </div>
                  <div className="detail-item">
                    <span className="arrow">➜</span>
                    <span className="detail-value">Section : {info.section}</span>
                  </div>
                  <div className="detail-item">
                    <span className="arrow">➜</span>
                    <span className="detail-value">Department of {info.departmentOfStudent}</span>
                  </div>
                </div>
              </div>

              <div className="info-row submission-section">
                <span className="info-label">Submitted to :</span>
                <div className="info-details">
                  <div className="detail-item">
                    <span className="arrow">➜</span>
                    <span className="detail-value">{info.teacherName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="arrow">➜</span>
                    <span className="detail-value">Lecturer, Department of {info.departmentOfTeacher}</span>
                  </div>
                </div>
              </div>
              
              <div className="info-row date-section">
                <span className="info-label">Date of Submission</span>
                <span className="info-value">{info.submissionDate}</span>
              </div>
            </div>

            {/* Bottom decorative element */}
            <div className="bottom-decoration ">
              <div className="decoration-line"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
