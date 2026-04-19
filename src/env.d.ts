/// <reference types="unplugin-icons/types/svelte" />
declare module '~icons/*' {
  import type { Component } from 'svelte';
  const content: Component<any>;
  export default content;
}
