
import os
import json
import re
from datetime import datetime, timezone


def parse_frontmatter(content):
    """Parses YAML frontmatter from markdown content."""
    frontmatter_regex = r"^---\s+(.*?)\s+---"
    match = re.search(frontmatter_regex, content, re.DOTALL)
    if not match:
        return {}

    yaml_content = match.group(1)
    data = {}
    for line in yaml_content.split('\n'):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip()

            # Basic parsing for arrays [a, b]
            if value.startswith('[') and value.endswith(']'):
                value = [v.strip() for v in value[1:-1].split(',') if v.strip()]
            else:
                # Remove quotes if present
                if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
                    value = value[1:-1]

            data[key] = value
    return data


def collect_markdown_files(root_dir):
    files = []
    for dirpath, _, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename.endswith('.md'):
                files.append(os.path.join(dirpath, filename))
    return files


def main():
    root_dir = os.getcwd()
    preferred_dir = os.environ.get('MEMORY_BANK_DIR') or os.environ.get('MEMORIES_DIR')
    candidates = (
        [os.path.join(root_dir, preferred_dir)]
        if preferred_dir
        else [os.path.join(root_dir, 'memory-bank'), os.path.join(root_dir, '.memories')]
    )

    memories_dir = ''
    for candidate in candidates:
        if os.path.isdir(candidate):
            memories_dir = candidate
            break

    if not memories_dir:
        print('Error: memory-bank or .memories directory not found.')
        return

    metadata_path = os.path.join(memories_dir, 'metadata.json')

    nodes = []
    edges = []

    for filepath in collect_markdown_files(memories_dir):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        fm = parse_frontmatter(content)
        if 'id' not in fm:
            continue

        relative_path = os.path.relpath(filepath, memories_dir).replace('\\', '/')
        node = {
            'id': fm['id'],
            'file': relative_path,
            'type': fm.get('type', 'unknown'),
            'tags': fm.get('tags', []) if isinstance(fm.get('tags', []), list) else [],
        }
        nodes.append(node)

        links = fm.get('links', [])
        if isinstance(links, list):
            for target in links:
                edges.append({
                    'from': fm['id'],
                    'to': target,
                })

    nodes.sort(key=lambda item: item['id'])
    edges.sort(key=lambda item: (item['from'], item['to']))

    metadata = {
        'version': '1.0.0',
        'lastUpdated': datetime.now(timezone.utc).isoformat(),
        'nodes': nodes,
        'edges': edges,
    }

    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)

    print(f"Synced {len(nodes)} nodes and {len(edges)} edges to {metadata_path}")


if __name__ == "__main__":
    main()
