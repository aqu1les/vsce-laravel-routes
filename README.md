# Laravel Routes Autocomplete

Enhance your Laravel development experience with **Laravel Route Autocomplete**, a powerful VSCode extension that provides intelligent route name suggestions directly inside the `route()` function. Whether you're working only with **Laravel** or with **JavaScript/TypeScript/Vue**, this extension streamlines your workflow by offering auto-completions based on your project's route definitions.

## 🚀 Features

- 🛠 **Smart Autocomplete** - Get route name suggestions in `route()` for both **Laravel PHP** and **ZiggyJS**.
- 📌 **Multi-Language Support** - Works seamlessly with **PHP, JavaScript, TypeScript, and Vue**.
- ⚙ **Configurable** - Customize supported languages and route file paths.

## 📌 How It Works

1. The extension scans your **Laravel routes** and extracts route names.
2. When you need your routes names, the extension suggests to you, based on your project's defined routes.
3. Works in **PHP files** and in **JS/TS/Vue files** (And any other language you need).

## 🎯 Configuration

You can customize the extension settings according to your project needs:

### **Settings Options**

| Setting                | Description                                  | Default Value |
|------------------------|----------------------------------------------|--------------|
| `laravelRoutes.languages` | Specifies the languages where autocomplete is enabled. | `["php", "javascript", "typescript", "vue"]` |
| `laravelRoutes.routePath` | Defines the path(s) where Laravel routes are stored. | `"routes"` |

### **Example `settings.json` Configuration**

```jsonc
{
  "laravelRoutes.languages": ["svelte"], // The already mentioned languages are always supported.
  "laravelRoutes.routePath": "my-routes"
}
```

## 🛠 Installation

1. Open **VSCode**.
2. Go to **Extensions** (`Ctrl+Shift+X` or `Cmd+Shift+X` on Mac).
3. Search for `Laravel Routes JS/TS` or `laravel-routes-js` (Or download it [here](https://marketplace.visualstudio.com/items?itemName=aqu1les.laravel-routes-js)).
4. Click **Install**.
5. Start coding and enjoy fast route name suggestions! 🚀

## 📝 Example Usage

### **In PHP**

```php
return redirect()->route('dashboard');
```

### **In JavaScript/TypeScript**

```js
const url = route('user.profile', { id: 1 });
```

## 🔧 Issues & Contributions

Have a suggestion or found a bug? Feel free to open an **issue** or **contribute** on GitHub!

## ❤️ Support

If you find this extension helpful, consider **starring the repository** and sharing it with other Laravel developers!

---

🚀 **Boost your Laravel development with fast and accurate route autocompletions!**
