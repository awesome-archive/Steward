/**
 * @file todo command plugin script
 * @description 待办事项管理，并在标签页显示
 * @author tomasy
 * @email solopea@gmail.com
 */

import $ from 'jquery'
import request from '../common/request'
import browser from 'webextension-polyfill'

var version = 2;
var name = 'todolist';
var key = 'todo';
var type = 'keyword';
var icon = browser.extension.getURL('img/todo.png');
var title = browser.i18n.getMessage(name + '_title');
var subtitle = browser.i18n.getMessage(name + '_subtitle');
var commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    editable: true
}];

function onInput(key) {
}

function onEnter(item) {
    if (!item || item.key === 'plugins') {
        addTodo.call(this, this.query);
    }
    else {
        removeTodo.call(this, item.id);
    }
}

function removeTodo(id) {
    var cmdbox = this;
    getTodos(function (todos) {
        todos = todos.filter(function (todo) {
            return todo.id !== id;
        });

        browser.storage.sync.set({
            todo: todos

        }, function () {
                cmdbox.empty();
            });
    });
}

function addTodo(todo) {
    var cmdbox = this;

    if (!todo) {
        return;
    }

    getTodos(function (todos) {
        if (!todos || !todos.length) {
            todos = [];
        }

        todos.push({
            id: +new Date(),
            title: todo

        });

        browser.storage.sync.set({
            todo: todos

        }, function () {
                cmdbox.empty();
                noticeBg2refresh();
            });
    });
}

function noticeBg2refresh() {
    request.send({
        action: 'addTodo'

    });
}

function getTodos(callback) {
    browser.storage.sync.get('todo', function (results) {
        var todos = results.todo;

        callback(todos);
    });
}

function dataFormat(rawList) {
    return rawList.map(function (item) {
        return {
            key: key,
            id: item.id,
            icon: icon,
            title: item.title,
            desc: subtitle

        };
    });
}
function showTodos() {
    var cmdbox = this;

    getTodos(function (todos) {
        cmdbox.showItemList(dataFormat(todos || []));
    });
}

export default {
    version,
    name: 'Todolist',
    icon,
    title,
    commands,
    showTodos: showTodos,
    onInput: onInput,
    onEnter: onEnter
};