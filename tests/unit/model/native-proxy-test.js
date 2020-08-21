import { run } from '@ember/runloop';
import { test, skip, module } from 'qunit';
import { setupTest, setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import DefaultSchema from 'ember-m3/services/m3-schema';

class TestSchema extends DefaultSchema {
  includesModel() {
    return true;
  }

  computeNestedModel(key, value, modelName) {
    if (value == null) {
      return null;
    }
    if (Array.isArray(value)) {
      return null;
    }
    if (typeof value === 'object' && value.constructor !== Date) {
      return {
        id: null,
        type: `${modelName}.${key}`,
        attributes: value,
      };
    }
  }
}

module('unit/model/native-proxy', function () {
  module('basic', function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
      this.store = this.owner.lookup('service:store');
      this.store.useProxy = true;

      this.owner.register('service:m3-schema', TestSchema);

      this.store.push({
        data: {
          id: 'urn:li:book:1',
          type: 'com.example.bookstore.Book',
          attributes: {
            title: 'How to Win Friends and Influence People',
            author: 'Dale Carnegie',
            metadata: {
              isbn: '1-4391-6734-6',
            },
          },
        },
      });
    });

    test('can access attribute without get', function (assert) {
      let book = this.store.peekRecord('com.example.bookstore.Book', 'urn:li:book:1');

      assert.strictEqual(book.title, 'How to Win Friends and Influence People');
    });

    test('can access nested model without get', function (assert) {
      let book = this.store.peekRecord('com.example.bookstore.Book', 'urn:li:book:1');

      assert.strictEqual(book.metadata.isbn, '1-4391-6734-6');
    });

    skip('test using an array attribute', function (assert) {
      let book = this.store.peekRecord('com.example.bookstore.Book', 'urn:li:book:1');
    });

    test('can use with object spread', function (assert) {
      let book = this.store.peekRecord('com.example.bookstore.Book', 'urn:li:book:1');

      const obj = {
        ...book,
      };

      assert.deepEqual(obj, {
        title: 'How to Win Friends and Influence People',
        author: 'Dale Carnegie',
        metadata: {
          isbn: '1-4391-6734-6',
        },
      });
    });
  });

  module('rendering', function (hooks) {
    setupRenderingTest(hooks);

    hooks.beforeEach(function () {
      this.store = this.owner.lookup('service:store');
      this.store.useProxy = true;

      this.owner.register('service:m3-schema', TestSchema);

      this.store.push({
        data: {
          id: 'urn:li:book:1',
          type: 'com.example.bookstore.Book',
          attributes: {
            title: 'How to Win Friends and Influence People',
            metadata: {
              isbn: '1-4391-6734-6',
            },
          },
        },
      });
    });

    test('can render content', async function (assert) {
      this.book = this.store.peekRecord('com.example.bookstore.Book', 'urn:li:book:1');

      await render(hbs`{{this.book.title}}`);

      assert.strictEqual(this.element.textContent, 'How to Win Friends and Influence People');
    });

    test('updates content on change', async function (assert) {
      this.book = this.store.peekRecord('com.example.bookstore.Book', 'urn:li:book:1');

      await render(hbs`{{this.book.title}}`);

      await run(() =>
        this.store.push({
          data: {
            id: 'urn:li:book:1',
            type: 'com.example.bookstore.Book',
            attributes: {
              title: 'The Way Things Work',
            },
          },
        })
      );

      assert.strictEqual(this.element.textContent, 'The Way Things Work');
    });

    test('updates content on nested model change', async function (assert) {
      this.book = this.store.peekRecord('com.example.bookstore.Book', 'urn:li:book:1');

      await render(hbs`{{this.book.metadata.isbn}}`);

      await run(() =>
        this.store.push({
          data: {
            id: 'urn:li:book:1',
            type: 'com.example.bookstore.Book',
            attributes: {
              metadata: {
                isbn: '0-395-42857-2',
              },
            },
          },
        })
      );

      assert.strictEqual(this.element.textContent, '0-395-42857-2');
    });
  });
});
