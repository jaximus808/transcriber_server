import re
from typing import Tuple

# Regex to capture:
# - first name (always)
# - last name (only if it doesn't start with '(')
# - role (text inside parentheses, without the parentheses)
# - team (after '|' if present)
_pattern = re.compile(
    r'^\s*'
    r'(?P<first>\S+)'                          # first name
    r'(?:\s+(?P<last>(?!\()[^\s]+))?'          # optional last name (must not begin with '(')
    r'(?:\s*\(\s*(?P<role>[^)]*?)\s*\))?'      # optional role inside parentheses
    r'(?:\s*\|\s*(?P<team>.+?))?'              # optional "| team"
    r'\s*$'
)

def parse_display_name(display_name: str) -> Tuple[str, str, str, str]:
    """
    Parse "First Last (role) | team" into four parts.
    If the second token is in parentheses, it's treated as role (last name is left blank).
    Strips the parentheses from role.
    Returns: (first_name, last_name, role, team)
    """
    m = _pattern.match(display_name)
    if not m:
        return '', '', '', ''
    gd = m.groupdict()
    return (
        gd.get('first') or '',
        gd.get('last')  or '',
        gd.get('role')  or '',
        gd.get('team')  or '',
    )

# Example usage:
if __name__ == "__main__":
    examples = [
        "Jaxon Poentis (swe) | backend",
        "Jaxon Poentis | backend",
        "Alice",
        "Bob (engineer)",
        "Carol Smith | frontend",
    ]
    for name in examples:
        fn, ln, role, team = parse_display_name(name)
        print(f"{name!r} → first={fn!r}, last={ln!r}, role={role!r}, team={team!r}")
