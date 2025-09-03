# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| 1.1.x   | :x:                |
| < 1.1   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

### Private Disclosure

1. **DO NOT** open a public issue
2. Email us at: security@yourproject.com
3. Include detailed information about the vulnerability
4. Provide steps to reproduce if possible

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Any suggested fixes (optional)

### Response Timeline  

- **Initial Response**: Within 24 hours
- **Assessment**: Within 72 hours  
- **Fix Timeline**: Varies by severity
  - Critical: Within 7 days
  - High: Within 30 days
  - Medium: Within 90 days
  - Low: Next major release

## Security Best Practices

### For Users
- Always use the latest version
- Verify download checksums when available
- Run in updated browsers with security patches
- Be cautious with untrusted image uploads

### For Developers
- All dependencies are regularly audited
- WebAssembly runs in sandboxed environment
- No server-side processing (privacy by design)
- CORS and CSP headers properly configured

## Known Security Considerations

1. **WebGPU Access**: Requires GPU access for acceleration
2. **File Processing**: All processing happens client-side
3. **Memory Usage**: Large images may consume significant RAM
4. **Browser Compatibility**: Security depends on browser implementation

## Disclosure Policy

After a security fix is released, we will:

1. Credit the reporter (if desired)
2. Publish security advisory
3. Update this document
4. Notify users through release notes

Thank you for helping keep our project secure!
