
<h1 align="center">
  <br>
  <!--
  <a href="#"><img src="#" alt="Markdownify" width="200"></a>
  -->
  <br>
  <a href="https://coreend.tech">CoreEnd</a> SDK
  <br>
  <br>
</h1>

<h4 align="center">An SDK for the <b>No-Code Backend - CoreEnd</b>. Simplifies and speeds up your work.</h4>

<br>

<p align="center">
  <a href="https://www.npmjs.com/package/coreend-sdk">
    <img src="https://img.shields.io/badge/NPM%20package-1.0.2-green"
         alt="NPM package">
  </a>
</p>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#how-to-use">How To Use</a>
</p>

## Key Features

* Full access to the <b>no-code backend</b>
* Handles all authentication (including tokens) automatically in the background
* Fully documentated
* Fast and simple to use

<br>

## How To Use

Checkout the <a href="https://coreend.tech/docs/en/overview-sdk/">Documentation</a>.

```bash
# install the package
$ yarn add coreend-sdk
# or
$ npm install coreend-sdk
```

```js
// initialize the sdk
import { initCoreEnd } from 'coreend-sdk';

const projectId = 123456;

initCoreEnd(projectId);
```

Now you can use all the features of <a href="https://coreend.tech">CoreEnd</a>.

```js
// example: get documents from resource
import { resourceDocs } from 'coreend-sdk';

const resourceId = 123456;

resourceDocs(resourceId).get();
```