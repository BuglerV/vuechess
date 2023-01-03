import { _ } from 'lodash';
import { createApp } from 'vue';

import Index from './components/index.vue';

let app = createApp(Index)

app.mount('#app');

window.vue = app;