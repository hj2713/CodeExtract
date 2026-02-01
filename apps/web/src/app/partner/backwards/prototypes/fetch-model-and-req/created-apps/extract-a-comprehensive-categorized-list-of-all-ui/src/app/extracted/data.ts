export interface Component {
  name: string;
  description: string;
  path: string;
  dependencies?: string[];
  tags?: string[];
}

export interface ComponentCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  components: Component[];
}

export const componentsData: ComponentCategory[] = [
  {
    id: 'core',
    title: 'Core UI Components',
    description: 'Main application components built specifically for EchoPilot',
    icon: '🎯',
    components: [
      {
        name: 'EmailList',
        description: 'Displays a scrollable list of emails with read/unread status, sender info, and timestamps. Supports privacy mode and keyboard navigation.',
        path: 'src/components/EmailList.tsx',
        dependencies: ['lucide-react', 'cn utility'],
        tags: ['email', 'list', 'accessibility']
      },
      {
        name: 'EmailView',
        description: 'Full email viewer with HTML content rendering, sender details, and navigation controls. Includes privacy mode support.',
        path: 'src/components/EmailView.tsx',
        dependencies: ['lucide-react', 'Button'],
        tags: ['email', 'viewer', 'detail']
      },
      {
        name: 'NarrationLog',
        description: 'Activity log showing agent actions, narration steps, and confirmation dialogs. Real-time updates with auto-scroll.',
        path: 'src/components/NarrationLog.tsx',
        dependencies: ['lucide-react', 'Button', 'ScrollArea'],
        tags: ['activity', 'log', 'confirmation']
      },
      {
        name: 'NavLink',
        description: 'Navigation link component with active state styling for routing within the application.',
        path: 'src/components/NavLink.tsx',
        dependencies: ['React Router'],
        tags: ['navigation', 'routing']
      },
      {
        name: 'SettingsDialog',
        description: 'Settings modal with demo mode toggle, privacy controls, and accessibility settings. Built with Dialog component.',
        path: 'src/components/SettingsDialog.tsx',
        dependencies: ['Dialog', 'Switch', 'Button', 'lucide-react'],
        tags: ['settings', 'modal', 'configuration']
      },
      {
        name: 'TranscriptPanel',
        description: 'Live conversation transcript showing user input and AI responses. Auto-scrolls to latest message with visual indicators.',
        path: 'src/components/TranscriptPanel.tsx',
        dependencies: ['ScrollArea', 'lucide-react'],
        tags: ['transcript', 'conversation', 'voice']
      },
      {
        name: 'VoiceButton',
        description: 'Animated microphone button with pulsing states for listening, processing, and speaking. Push-to-talk interface.',
        path: 'src/components/VoiceButton.tsx',
        dependencies: ['lucide-react'],
        tags: ['voice', 'button', 'animation']
      }
    ]
  },
  {
    id: 'ui-library',
    title: 'UI Library Components',
    description: 'shadcn/ui components built with Radix UI primitives and styled with Tailwind CSS',
    icon: '🎨',
    components: [
      {
        name: 'Accordion',
        description: 'Collapsible content sections with smooth animations. Based on Radix UI Accordion.',
        path: 'src/components/ui/accordion.tsx',
        dependencies: ['@radix-ui/react-accordion'],
        tags: ['radix', 'collapsible']
      },
      {
        name: 'Alert Dialog',
        description: 'Modal dialog for important confirmations or alerts that interrupt user flow.',
        path: 'src/components/ui/alert-dialog.tsx',
        dependencies: ['@radix-ui/react-alert-dialog'],
        tags: ['radix', 'modal', 'confirmation']
      },
      {
        name: 'Alert',
        description: 'Contextual feedback messages with variants for info, success, warning, and error.',
        path: 'src/components/ui/alert.tsx',
        tags: ['notification', 'feedback']
      },
      {
        name: 'Aspect Ratio',
        description: 'Container that maintains a specific aspect ratio for responsive media content.',
        path: 'src/components/ui/aspect-ratio.tsx',
        dependencies: ['@radix-ui/react-aspect-ratio'],
        tags: ['radix', 'layout', 'responsive']
      },
      {
        name: 'Avatar',
        description: 'User profile image with fallback initials and placeholder support.',
        path: 'src/components/ui/avatar.tsx',
        dependencies: ['@radix-ui/react-avatar'],
        tags: ['radix', 'image', 'profile']
      },
      {
        name: 'Badge',
        description: 'Small labeled status indicators with multiple color variants.',
        path: 'src/components/ui/badge.tsx',
        tags: ['label', 'status']
      },
      {
        name: 'Breadcrumb',
        description: 'Navigation hierarchy showing current location within the app structure.',
        path: 'src/components/ui/breadcrumb.tsx',
        tags: ['navigation', 'hierarchy']
      },
      {
        name: 'Button',
        description: 'Versatile button component with variants (default, destructive, outline, ghost), sizes, and loading states.',
        path: 'src/components/ui/button.tsx',
        tags: ['button', 'interactive']
      },
      {
        name: 'Calendar',
        description: 'Date picker with month/year navigation and date selection.',
        path: 'src/components/ui/calendar.tsx',
        dependencies: ['react-day-picker'],
        tags: ['date', 'picker']
      },
      {
        name: 'Card',
        description: 'Container component with header, content, and footer sections.',
        path: 'src/components/ui/card.tsx',
        tags: ['container', 'layout']
      },
      {
        name: 'Carousel',
        description: 'Image/content carousel with navigation arrows and dot indicators.',
        path: 'src/components/ui/carousel.tsx',
        dependencies: ['embla-carousel-react'],
        tags: ['carousel', 'slider']
      },
      {
        name: 'Chart',
        description: 'Recharts wrapper for creating responsive charts and data visualizations.',
        path: 'src/components/ui/chart.tsx',
        dependencies: ['recharts'],
        tags: ['chart', 'visualization']
      },
      {
        name: 'Checkbox',
        description: 'Accessible checkbox with indeterminate state support.',
        path: 'src/components/ui/checkbox.tsx',
        dependencies: ['@radix-ui/react-checkbox'],
        tags: ['radix', 'form', 'input']
      },
      {
        name: 'Collapsible',
        description: 'Expandable/collapsible content section with trigger button.',
        path: 'src/components/ui/collapsible.tsx',
        dependencies: ['@radix-ui/react-collapsible'],
        tags: ['radix', 'expandable']
      },
      {
        name: 'Command',
        description: 'Command palette with search, keyboard navigation, and command groups.',
        path: 'src/components/ui/command.tsx',
        dependencies: ['cmdk'],
        tags: ['command', 'search', 'keyboard']
      },
      {
        name: 'Context Menu',
        description: 'Right-click context menu with nested submenus and keyboard shortcuts.',
        path: 'src/components/ui/context-menu.tsx',
        dependencies: ['@radix-ui/react-context-menu'],
        tags: ['radix', 'menu', 'contextmenu']
      },
      {
        name: 'Dialog',
        description: 'Modal dialog overlay with customizable content and close behavior.',
        path: 'src/components/ui/dialog.tsx',
        dependencies: ['@radix-ui/react-dialog'],
        tags: ['radix', 'modal', 'overlay']
      },
      {
        name: 'Drawer',
        description: 'Slide-out panel from screen edges with swipe-to-close support.',
        path: 'src/components/ui/drawer.tsx',
        dependencies: ['vaul'],
        tags: ['drawer', 'panel', 'mobile']
      },
      {
        name: 'Dropdown Menu',
        description: 'Dropdown menu with items, separators, checkboxes, and radio groups.',
        path: 'src/components/ui/dropdown-menu.tsx',
        dependencies: ['@radix-ui/react-dropdown-menu'],
        tags: ['radix', 'menu', 'dropdown']
      },
      {
        name: 'Form',
        description: 'Form components with validation, error messages, and label management.',
        path: 'src/components/ui/form.tsx',
        dependencies: ['react-hook-form', '@radix-ui/react-label'],
        tags: ['form', 'validation', 'input']
      },
      {
        name: 'Hover Card',
        description: 'Popover card that appears on hover with customizable content.',
        path: 'src/components/ui/hover-card.tsx',
        dependencies: ['@radix-ui/react-hover-card'],
        tags: ['radix', 'popover', 'hover']
      },
      {
        name: 'Input OTP',
        description: 'One-time password input with individual character boxes.',
        path: 'src/components/ui/input-otp.tsx',
        dependencies: ['input-otp'],
        tags: ['input', 'otp', 'authentication']
      },
      {
        name: 'Input',
        description: 'Standard text input field with variants and validation states.',
        path: 'src/components/ui/input.tsx',
        tags: ['input', 'form', 'text']
      },
      {
        name: 'Label',
        description: 'Form label with accessibility features linked to form controls.',
        path: 'src/components/ui/label.tsx',
        dependencies: ['@radix-ui/react-label'],
        tags: ['radix', 'form', 'label']
      },
      {
        name: 'Menubar',
        description: 'Application menubar with dropdown menus (File, Edit, View style).',
        path: 'src/components/ui/menubar.tsx',
        dependencies: ['@radix-ui/react-menubar'],
        tags: ['radix', 'menu', 'navigation']
      },
      {
        name: 'Navigation Menu',
        description: 'Complex navigation with dropdown submenus and indicators.',
        path: 'src/components/ui/navigation-menu.tsx',
        dependencies: ['@radix-ui/react-navigation-menu'],
        tags: ['radix', 'navigation', 'menu']
      },
      {
        name: 'Pagination',
        description: 'Page navigation controls with numbered pages and prev/next buttons.',
        path: 'src/components/ui/pagination.tsx',
        tags: ['pagination', 'navigation']
      },
      {
        name: 'Popover',
        description: 'Floating content container anchored to a trigger element.',
        path: 'src/components/ui/popover.tsx',
        dependencies: ['@radix-ui/react-popover'],
        tags: ['radix', 'popover', 'floating']
      },
      {
        name: 'Progress',
        description: 'Progress bar indicator with percentage-based fill.',
        path: 'src/components/ui/progress.tsx',
        dependencies: ['@radix-ui/react-progress'],
        tags: ['radix', 'progress', 'indicator']
      },
      {
        name: 'Radio Group',
        description: 'Mutually exclusive radio button group with keyboard navigation.',
        path: 'src/components/ui/radio-group.tsx',
        dependencies: ['@radix-ui/react-radio-group'],
        tags: ['radix', 'form', 'radio']
      },
      {
        name: 'Resizable',
        description: 'Resizable panels with draggable dividers for split layouts.',
        path: 'src/components/ui/resizable.tsx',
        dependencies: ['react-resizable-panels'],
        tags: ['resizable', 'layout', 'panel']
      },
      {
        name: 'Scroll Area',
        description: 'Custom scrollable area with styled scrollbars.',
        path: 'src/components/ui/scroll-area.tsx',
        dependencies: ['@radix-ui/react-scroll-area'],
        tags: ['radix', 'scroll', 'overflow']
      },
      {
        name: 'Select',
        description: 'Custom select dropdown with search and keyboard navigation.',
        path: 'src/components/ui/select.tsx',
        dependencies: ['@radix-ui/react-select'],
        tags: ['radix', 'select', 'dropdown']
      },
      {
        name: 'Separator',
        description: 'Visual divider line (horizontal or vertical) between content.',
        path: 'src/components/ui/separator.tsx',
        dependencies: ['@radix-ui/react-separator'],
        tags: ['radix', 'divider', 'separator']
      },
      {
        name: 'Sheet',
        description: 'Slide-out panel overlay from screen edges (drawer alternative).',
        path: 'src/components/ui/sheet.tsx',
        dependencies: ['@radix-ui/react-dialog'],
        tags: ['radix', 'panel', 'overlay']
      },
      {
        name: 'Sidebar',
        description: 'Application sidebar with collapsible sections and navigation.',
        path: 'src/components/ui/sidebar.tsx',
        tags: ['navigation', 'layout', 'sidebar']
      },
      {
        name: 'Skeleton',
        description: 'Loading placeholder with pulsing animation.',
        path: 'src/components/ui/skeleton.tsx',
        tags: ['loading', 'placeholder']
      },
      {
        name: 'Slider',
        description: 'Range slider for selecting numerical values.',
        path: 'src/components/ui/slider.tsx',
        dependencies: ['@radix-ui/react-slider'],
        tags: ['radix', 'slider', 'range']
      },
      {
        name: 'Sonner',
        description: 'Toast notification system with queue management.',
        path: 'src/components/ui/sonner.tsx',
        dependencies: ['sonner'],
        tags: ['toast', 'notification']
      },
      {
        name: 'Switch',
        description: 'Toggle switch for binary on/off states.',
        path: 'src/components/ui/switch.tsx',
        dependencies: ['@radix-ui/react-switch'],
        tags: ['radix', 'toggle', 'switch']
      },
      {
        name: 'Table',
        description: 'Data table with header, body, and footer sections.',
        path: 'src/components/ui/table.tsx',
        tags: ['table', 'data', 'grid']
      },
      {
        name: 'Tabs',
        description: 'Tabbed interface with content panels for each tab.',
        path: 'src/components/ui/tabs.tsx',
        dependencies: ['@radix-ui/react-tabs'],
        tags: ['radix', 'tabs', 'navigation']
      },
      {
        name: 'Textarea',
        description: 'Multi-line text input with auto-resize support.',
        path: 'src/components/ui/textarea.tsx',
        tags: ['textarea', 'form', 'input']
      },
      {
        name: 'Toast',
        description: 'Toast notification components with action buttons.',
        path: 'src/components/ui/toast.tsx',
        dependencies: ['@radix-ui/react-toast'],
        tags: ['radix', 'toast', 'notification']
      },
      {
        name: 'Toaster',
        description: 'Toast notification container and provider.',
        path: 'src/components/ui/toaster.tsx',
        dependencies: ['@radix-ui/react-toast'],
        tags: ['radix', 'toast', 'provider']
      },
      {
        name: 'Toggle Group',
        description: 'Group of toggle buttons with single or multiple selection.',
        path: 'src/components/ui/toggle-group.tsx',
        dependencies: ['@radix-ui/react-toggle-group'],
        tags: ['radix', 'toggle', 'group']
      },
      {
        name: 'Toggle',
        description: 'Toggle button with pressed/unpressed states.',
        path: 'src/components/ui/toggle.tsx',
        dependencies: ['@radix-ui/react-toggle'],
        tags: ['radix', 'toggle', 'button']
      },
      {
        name: 'Tooltip',
        description: 'Contextual tooltip on hover with customizable content.',
        path: 'src/components/ui/tooltip.tsx',
        dependencies: ['@radix-ui/react-tooltip'],
        tags: ['radix', 'tooltip', 'hover']
      }
    ]
  },
  {
    id: 'hooks',
    title: 'React Hooks',
    description: 'Custom React hooks for state management, voice interaction, and UI utilities',
    icon: '🪝',
    components: [
      {
        name: 'useEchoPilot',
        description: 'Main application hook managing conversation state, agent responses, email navigation, and voice interaction flow.',
        path: 'src/hooks/useEchoPilot.ts',
        dependencies: ['useState', 'useCallback', 'useRef'],
        tags: ['state', 'agent', 'conversation']
      },
      {
        name: 'useVoiceRecorder',
        description: 'Audio recording hook using MediaRecorder API for capturing voice input.',
        path: 'src/hooks/useVoiceRecorder.ts',
        dependencies: ['useState', 'useCallback', 'MediaRecorder'],
        tags: ['audio', 'recording', 'voice']
      },
      {
        name: 'useWebSpeechRecognition',
        description: 'Browser Speech Recognition API hook for real-time voice-to-text transcription.',
        path: 'src/hooks/useWebSpeechRecognition.ts',
        dependencies: ['useState', 'useCallback', 'Web Speech API'],
        tags: ['speech', 'recognition', 'voice']
      },
      {
        name: 'use-mobile',
        description: 'Responsive design hook detecting mobile viewport sizes using matchMedia.',
        path: 'src/hooks/use-mobile.tsx',
        dependencies: ['useState', 'useEffect'],
        tags: ['responsive', 'mobile', 'viewport']
      },
      {
        name: 'use-toast',
        description: 'Toast notification state management hook with add/update/dismiss actions.',
        path: 'src/hooks/use-toast.ts',
        dependencies: ['useState'],
        tags: ['toast', 'notification', 'state']
      }
    ]
  },
  {
    id: 'pages',
    title: 'Pages & Routes',
    description: 'Application pages and route components',
    icon: '📄',
    components: [
      {
        name: 'Index',
        description: 'Main application page with three-panel layout: voice controls, email view, and activity log. Integrates all core features.',
        path: 'src/pages/Index.tsx',
        dependencies: ['useEchoPilot', 'useWebSpeechRecognition', 'Core Components'],
        tags: ['page', 'layout', 'main']
      },
      {
        name: 'NotFound',
        description: '404 error page for handling invalid routes.',
        path: 'src/pages/NotFound.tsx',
        tags: ['page', '404', 'error']
      }
    ]
  }
];
