"""
DAP Activity Logger
====================
Prints real-time activity logs to terminal for visibility into system operations.
Each component (AIA, AIP, AAVA, CM) has its own colored output.
"""

from datetime import datetime
from typing import Optional
import sys

# ANSI color codes for terminal output
class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    
    # Component colors
    AIA = "\033[94m"      # Blue - Address Information Agent
    AIP = "\033[92m"      # Green - Address Information Provider
    AAVA = "\033[93m"     # Yellow - Authorized Address Validation Agency
    CM = "\033[95m"       # Magenta - Central Mapper
    AIU = "\033[96m"      # Cyan - Address Information User
    SYSTEM = "\033[90m"   # Gray - System messages
    ERROR = "\033[91m"    # Red - Errors
    SUCCESS = "\033[92m"  # Green - Success


def _timestamp():
    return datetime.now().strftime("%H:%M:%S")


def _print_log(component: str, color: str, action: str, details: str = "", extra: dict = None):
    """Print a formatted log entry to terminal."""
    timestamp = _timestamp()
    
    # Build the log line
    line = f"{Colors.SYSTEM}[{timestamp}]{Colors.RESET} "
    line += f"{color}{Colors.BOLD}[{component}]{Colors.RESET} "
    line += f"{color}{action}{Colors.RESET}"
    
    if details:
        line += f" - {details}"
    
    print(line)
    
    # Print extra details if provided
    if extra:
        for key, value in extra.items():
            print(f"         {Colors.SYSTEM}├─ {key}: {Colors.RESET}{value}")
    
    sys.stdout.flush()


def log_aia(action: str, details: str = "", **extra):
    """Log Address Information Agent (AIA) activity."""
    _print_log("AIA", Colors.AIA, action, details, extra if extra else None)


def log_aip(action: str, details: str = "", **extra):
    """Log Address Information Provider (AIP) activity."""
    _print_log("AIP", Colors.AIP, action, details, extra if extra else None)


def log_aava(action: str, details: str = "", **extra):
    """Log Authorized Address Validation Agency (AAVA) activity."""
    _print_log("AAVA", Colors.AAVA, action, details, extra if extra else None)


def log_cm(action: str, details: str = "", **extra):
    """Log Central Mapper (CM) activity."""
    _print_log("CM", Colors.CM, action, details, extra if extra else None)


def log_aiu(action: str, details: str = "", **extra):
    """Log Address Information User (AIU) activity."""
    _print_log("AIU", Colors.AIU, action, details, extra if extra else None)


def log_system(action: str, details: str = "", **extra):
    """Log system-level activity."""
    _print_log("SYSTEM", Colors.SYSTEM, action, details, extra if extra else None)


def log_error(component: str, action: str, details: str = "", **extra):
    """Log an error."""
    _print_log(component, Colors.ERROR, f"ERROR: {action}", details, extra if extra else None)


def log_success(component: str, action: str, details: str = "", **extra):
    """Log a success message."""
    _print_log(component, Colors.SUCCESS, f"✓ {action}", details, extra if extra else None)


def print_banner():
    """Print startup banner."""
    banner = f"""
{Colors.BOLD}╔══════════════════════════════════════════════════════════════════╗
║           DIGITAL ADDRESS PROJECT - ACTIVITY MONITOR             ║
╠══════════════════════════════════════════════════════════════════╣
║  {Colors.AIA}[AIA]{Colors.RESET}{Colors.BOLD} Address Information Agent    - Consent Manager          ║
║  {Colors.AIP}[AIP]{Colors.RESET}{Colors.BOLD} Address Information Provider - Data Registry            ║
║  {Colors.AAVA}[AAVA]{Colors.RESET}{Colors.BOLD} Address Validation Agency   - Physical Verification    ║
║  {Colors.CM}[CM]{Colors.RESET}{Colors.BOLD}  Central Mapper              - Discovery Service         ║
║  {Colors.AIU}[AIU]{Colors.RESET}{Colors.BOLD} Address Information User     - Service Providers        ║
╚══════════════════════════════════════════════════════════════════╝{Colors.RESET}
"""
    print(banner)
    sys.stdout.flush()
