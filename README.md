# Desktop To Translate
An Electron application that uses Tesseract OCR to recognize text selected on a screen and automatically open it up in Google Translate.

![Desktop To Translate Animated Demo](readme/main.gif)

## How To Use

Desktop To Translate binds a global hotkey (default: CommandOrControl+P), that when pressed lets you select an area of your screen for it to OCR.

Simply press the hotkey, drag the scanning window over the text you want to recognize, and it should attempt to scan it and open the result in google translate.

Additionally, a hotkey can also be bound for Vertical text (default: none).

Desktop To Translate uses Tesseract under the hood for OCR, using the set of best trained data that they have available. As a result, the same limitations that apply to tesseract apply to this applications. In particular, if there is low contrast between the text and the background of the text, then tesseract will struggle to detect it. More information can be found [here](https://github.com/tesseract-ocr/tesseract/wiki/ImproveQuality).

## Configuration Options

The following options are available for configuration:

* **Horizontal Hotkey**: the hotkey to press to scan horizontal text. (Default: CommandOrControl+P)
* **Vertical Hotkey**: the hotkey to press to scan vertical text (Default: None)
* **View Mode**: This option is only really relevant for Japanese input. This controls the view that opens when text is scanned in. By deafult we load Google Translate with Rikaikun, but you can disable rikaikun or choose a view only with Rikaikun.
* **Rikaikun Hotkey**: This controls the hotkey that must be pressed to have Rikaikun pop up over text. (Default: Alt)
* **Source Language**: The language that tesseract will try to scan for.
* **Target Language**: The language that will be sent to google translate as the target language.

## Custom Dictionary

The custom dictionary feature allows you to supply a list of words to replace before sending the scanned text to Google Translate. This can be useful if you find GT is constantly misinterpreting a word or is unable to handle a proper name. 

To add words to the custom dictionary, simply open the custom dictionary window from the navigation menu, and add a new row to the dictionary. The from row should be the word that you want to replace, where the to row is the word it should be replaced with. The replace is done using a simple global replace.

## Running Locally

In order to run this repository locally you just need to clone the repo and run

```
npm install
npm run start
```

All the dependencies of the project should be pure JS, to avoid issues surrounding packaging with electron.

If you want to package the project into a DMG or EXE file you can do so by running

```
npm run dist
```
