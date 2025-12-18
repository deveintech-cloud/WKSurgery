/**
 * Google Apps Script to collect form submissions into a Google Sheet.
 *
 * Usage:
 * 1. Create a Google Spreadsheet and copy its ID (from the URL).
 * 2. Replace SPREADSHEET_ID below with your Spreadsheet ID.
 * 3. Deploy -> New deployment -> Select "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone (even anonymous)   (or "Anyone" if you want public submission)
 * 4. Copy the Web App URL and paste it into the client HTML where indicated.
 *
 * The script expects POST parameters: name, email, phone, message
 * It will create a sheet named "Responses" if not present and append rows:
 * Timestamp | Name | Email | Phone | Message | User-Agent | IP (if provided)
 */

/* === CONFIG === */
var SPREADSHEET_ID = "1ycirbLKFvdXgleX2pLHUNIOd2AdFaSibJPXmX4SzPpc";
/* ============= */

function _getSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName("Responses");
  if (!sheet) {
    sheet = ss.insertSheet("Responses");
    sheet.appendRow(["Timestamp", "Name", "Email", "Phone", "Message", "User-Agent", "Source IP"]);
  }
  return sheet;
}

// Primary POST handler
function doPost(e) {
  try {
    var sheet = _getSheet();

    // e.parameter contains form fields for Content-Type: application/x-www-form-urlencoded or form data
    var params = e.parameter || {};
    var name = params.name || "";
    var email = params.email || "";
    var phone = params.phone || "";
    var message = params.message || "";

    // Sometimes full JSON body is sent (application/json); parse e.postData.contents if present
    if (!name && e.postData && e.postData.type === "application/json") {
      var json = JSON.parse(e.postData.contents || "{}");
      name = json.name || name;
      email = json.email || email;
      phone = json.phone || phone;
      message = json.message || message;
    }

    var userAgent = e.postData && e.postData.type ? (e.postData.type + "") : "";
    try {
      // Try to get user-agent from headers (Apps Script provides this in e.postData.headers for some requests)
      if (e.postData && e.postData.headers && e.postData.headers["user-agent"]) {
        userAgent = e.postData.headers["user-agent"];
      }
    } catch (err) {}

    // Source IP is not directly available in Apps Script web apps for anonymous requests.
    var sourceIp = (e.postData && e.postData.headers && (e.postData.headers["x-forwarded-for"] || e.postData.headers["X-Forwarded-For"])) || "";

    sheet.appendRow([new Date(), name, email, phone, message, userAgent, sourceIp]);

    var output = ContentService.createTextOutput(JSON.stringify({
      result: "success",
      message: "Data saved"
    }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  } catch (err) {
    var output = ContentService.createTextOutput(JSON.stringify({
      result: "error",
      error: err.message
    }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}

// Optional: simple GET to test the web app
function doGet(e) {
  var output = ContentService.createTextOutput(JSON.stringify({
    result: "ready",
    timestamp: new Date().toString()
  }));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
