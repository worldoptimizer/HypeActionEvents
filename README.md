# Hype Action Events

![Hype-ActionEvents|690x487](https://playground.maxziebell.de/Hype/ActionEvents/HypeActionEvents.jpg)

<sup>The cover artwork is not hosted in this repository and &copy;opyrighted by Max Ziebell</sup>

Extension that offers code execution based on events and can be declared by data attributes. Furthermore, it offers code execution through the Custom Behavior interface.


## Documentation

There is a [JSDoc](https://en.wikipedia.org/wiki/JSDoc) based documentation of the functions at https://doxdox.org/worldoptimizer/HypeActionEvents

Content Delivery Network (CDN)
--

Latest version can be linked into your project using the following in the head section of your project:

```html
<script src="https://cdn.jsdelivr.net/gh/worldoptimizer/HypeActionEvents/HypeActionEvents.min.js"></script>
```
Optionally you can also link a SRI version or specific releases. 
Read more about that on the JsDelivr (CDN) page for this extension at https://www.jsdelivr.com/package/gh/worldoptimizer/HypeActionEvents

Learn how to use the latest extension version and how to combine extensions into one file at
https://github.com/worldoptimizer/HypeCookBook/wiki/Including-external-files-and-Hype-extensions


---

# Documentation

Hype Action Events is a powerful extension for Tumult Hype that adds support for custom event handling and advanced features such as ResizeObserver, IntersectionObserver, MutationObserver, and much more. This extension simplifies the process of adding customized event handling and provides a consistent API for developers to interact with Hype documents.

## Getting Started

To use the Hype Action Events extension, simply include the script in your project and start using the features provided by the extension.

1. Include the Hype Action Events script in your project.
2. Use the provided API to interact with your Hype documents and add custom event handling.

## Frequently Asked Questions

**Q: What are the main features of the Hype Action Events extension?**

A: Hype Action Events extension provides support for custom event handling, ResizeObserver, IntersectionObserver, MutationObserver, and many other features. It simplifies the process of adding customized event handling and provides a consistent API for developers to interact with Hype documents.

**Q: Can I use Hype Action Events with Tumult Hype projects?**

A: Yes, the Hype Action Events extension is designed specifically for Tumult Hype and works seamlessly with your Hype projects.

**Q: Is the Hype Action Events extension compatible with all browsers?**

A: Hype Action Events extension is compatible with modern browsers that support JavaScript, ResizeObserver, IntersectionObserver, and MutationObserver. However, it may not work with older browsers that do not support these features.

## Data Attributes

| Attribute Name | Function |
| -------------- | -------- |
| `data-scene-load-action` | Triggers actions on Hype scene load |
| `data-scene-unload-action` | Triggers actions on Hype scene unload |
| `data-scene-prepare-action` | Triggers actions on Hype scene prepare for display |
| `data-layout-request-action` | Triggers actions on Hype layout request |
| `data-symbol-load-action` | Triggers actions on Hype symbol load |
| `data-symbol-unload-action` | Triggers actions on Hype symbol unload |
| `data-behavior-action` | Triggers actions based on a custom behavior |
| `data-timeline-complete-action` | Triggers actions on Hype timeline complete |
| `data-timeline-[Timeline Name sanitized]-complete-action` | Triggers actions on Hype timeline complete for specific timeline |
| `data-resize-action` | Triggers actions on element resize |
| `data-intersection-action` | Triggers actions on element intersection |
| `data-mutation-action` | Triggers actions on element mutation |
| `data-animation-frame-action` | Triggers actions on animation frame |
| `data-collision-start-action` | Triggers actions on Matter physics engine collision start |
| `data-collision-active-action` | Triggers actions on Matter physics engine collision active |
| `data-collision-end-action` | Triggers actions on Matter physics engine collision end |
| `data-window-[WindowEvent]-action` | Triggers actions on specified window events |
| `data-document-[DocumentEvent]-action` | Triggers actions on specified document events |

## Extended hypeDocument API

| Command                             | Function                                                                 |
|-------------------------------------|--------------------------------------------------------------------------|
| hypeDocument.getSymbolInstance      | Get the symbol instance for a given element.                             |
| hypeDocument.triggerAction          | Trigger an action with a specified code and options.                     |
| hypeDocument.triggerActionsByAttribute | Trigger actions by attribute in the specified element and options.    |
| hypeDocument.querySelector          | Select a single element within the current scene using a CSS selector.  |
| hypeDocument.querySelectorAll       | Select all elements within the current scene using a CSS selector.      |

## HypeActionEvents API

| Command              | Function                                              |
|----------------------|-------------------------------------------------------|
| HypeActionEvents.version  | Get the current version of the extension.          |
| HypeActionEvents.getDefault | Get a default value used in the extension.       |
| HypeActionEvents.setDefault | Set a default value used in the extension.       |

By using the Hype Action Events extension, you can enhance your Tumult Hype projects with custom event handling, advanced features, and a consistent API for working with Hype documents.
