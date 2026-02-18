# Sample Component

This is a sample README to demonstrate the ReadmeModal component.

## Features

- **Markdown rendering** with GitHub Flavored Markdown
- Syntax highlighting for code blocks
- Links that open in new tabs
- Tables support

## Installation

```bash
npm install sample-component
```

## Usage

```tsx
import { SampleComponent } from 'sample-component';

function App() {
  return (
    <SampleComponent
      title="Hello World"
      onAction={() => console.log('clicked')}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | The title to display |
| `onAction` | `() => void` | `undefined` | Callback when action is triggered |
| `variant` | `'primary' \| 'secondary'` | `'primary'` | Visual variant |

## Dependencies

This component requires:

- React 18+
- Tailwind CSS
- `clsx` for className merging

> **Note**: Make sure to import the CSS file in your application.

## License

MIT
