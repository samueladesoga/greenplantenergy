<?php
/**
 * Green Plant Energy Oil & Gas Limited
 * Contact form mailer
 *
 * Expects a POST request with JSON body (from fetch) or form-encoded data.
 * Returns JSON: { "success": true } or { "success": false, "error": "..." }
 */

header('Content-Type: application/json');

// ── Only accept POST ──────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed.']);
    exit;
}

// ── Read input (supports both JSON body and form-encoded) ─────────
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (stripos($contentType, 'application/json') !== false) {
    $raw   = file_get_contents('php://input');
    $data  = json_decode($raw, true) ?? [];
} else {
    $data  = $_POST;
}

// ── Sanitise helper ───────────────────────────────────────────────
function clean(string $value): string {
    // Strip tags, trim, and remove any newline characters (header injection prevention)
    return trim(strip_tags(str_replace(["\r", "\n"], ' ', $value)));
}

// ── Extract & sanitise fields ─────────────────────────────────────
$name       = clean($data['name']        ?? '');
$phone      = clean($data['phone']       ?? '');
$email      = clean($data['email']       ?? '');
$volume     = clean($data['volume']      ?? '');
$clientType = clean($data['client-type'] ?? '');
$message    = clean($data['message']     ?? '');

// ── Validate required fields ──────────────────────────────────────
if (!$name || !$phone || !$email || !$message) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Please fill in all required fields.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Please provide a valid email address.']);
    exit;
}

// ── Compose email ─────────────────────────────────────────────────
$to      = 'greenplantenergyservices@gmail.com'; 
$subject = "Diesel Supply Enquiry from {$name}";

$body  = "You have received a new enquiry via the Green Plant Energy website.\n";
$body .= str_repeat('-', 50) . "\n\n";
$body .= "Name        : {$name}\n";
$body .= "Phone       : {$phone}\n";
$body .= "Email       : {$email}\n";
$body .= "Client Type : {$clientType}\n";
$body .= "Volume (L)  : {$volume}\n\n";
$body .= "Message:\n{$message}\n\n";
$body .= str_repeat('-', 50) . "\n";
$body .= "Sent from: greenplantenergy.ng contact form\n";

// Headers — set Reply-To so you can reply directly to the visitor
$headers  = "From: website@greenplantenergy.com\r\n";
$headers .= "Reply-To: {$name} <{$email}>\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// ── Send ──────────────────────────────────────────────────────────
$sent = mail($to, $subject, $body, $headers);

if ($sent) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Mail could not be sent. Please call us directly.']);
}
