// ==UserScript==
// @name           JIRA When javascript.enabled=false
// @namespace      holatuwol
// @version        0.6
// @updateURL      https://github.com/holatuwol/liferay-faster-deploy/raw/master/userscripts/jira_lite.user.js
// @downloadURL    https://github.com/holatuwol/liferay-faster-deploy/raw/master/userscripts/jira_lite.user.js
// @match          https://issues.liferay.com/browse/*
// @match          https://issues.liferay.com/secure/LinkJiraIssue!*
// @match          https://services.liferay.com/browse/*
// @match          https://services.liferay.com/secure/LinkJiraIssue!*
// @grant          none
// ==/UserScript==

var styleElement = document.createElement('style');

styleElement.textContent = `
  html body {
    overflow-y: auto;
  }
`;

document.head.appendChild(styleElement);

function getTicketId() {
  var ticketName = document.location.pathname.substring(document.location.pathname.lastIndexOf('/') + 1);

  return document.querySelector('a[data-issue-key="' + ticketName + '"]').getAttribute('rel');
}

function getCurrentUser() {
  return document.querySelector('#header-details-user-fullname').getAttribute('data-username');
}

function getActionLinks(comment) {
  var actionLinksNode = document.createElement('div');
  actionLinksNode.classList.add('action-links');

  if (comment.author.key == getCurrentUser()) {
    var editCommentNode = document.createElement('a');
    editCommentNode.setAttribute('id', 'edit_comment_' + comment.id);
    editCommentNode.setAttribute('href', '/secure/EditComment!default.jspa?id=' + getTicketId() + '&commentId=' + comment.id);
    editCommentNode.setAttribute('title', 'Edit');
    editCommentNode.classList.add('edit-comment', 'issue-comment-action');

    var editCommentIcon = document.createElement('span');
    editCommentIcon.classList.add('icon-default', 'aui-icon', 'aui-icon-small', 'aui-iconfont-edit');
    editCommentIcon.textContent = 'Edit';

    editCommentNode.appendChild(editCommentIcon);
    actionLinksNode.appendChild(editCommentNode);
  }

  return actionLinksNode;
}

function getActionDetails(comment) {
  var actionDetailsNode = document.createElement('div');
  actionDetailsNode.classList.add('action-details');

  var avatarNode = document.createElement('a');
  avatarNode.setAttribute('id', 'commentauthor_' + comment.id + '_verbose');
  avatarNode.setAttribute('rel', comment.author.key);
  avatarNode.setAttribute('href', '/secure/ViewProfile.jspa?name=' + comment.author.name);
  avatarNode.classList.add('user-hover', 'user-avatar');

  var avatarOuterContainerNode = document.createElement('span');
  avatarOuterContainerNode.classList.add('aui-avatar', 'aui-avatar-xsmall');

  var avatarInnerContainerNode = document.createElement('span');
  avatarInnerContainerNode.classList.add('aui-avatar-inner');

  var avatarImageNode = document.createElement('img');
  avatarImageNode.setAttribute('src', comment.author.avatarUrls['16x16']);
  avatarImageNode.setAttribute('alt', comment.author.name);

  avatarInnerContainerNode.appendChild(avatarImageNode);
  avatarOuterContainerNode.appendChild(avatarInnerContainerNode);

  avatarNode.appendChild(avatarOuterContainerNode);
  avatarNode.appendChild(document.createTextNode(comment.author.displayName));

  var commentDate = new Date(comment.created);

  var commentDateContainer = document.createElement('span');
  commentDateContainer.classList.add('commentdate_' + comment.id + '_verbose');
  commentDateContainer.classList.add('subText');

  var commentDateNode = document.createElement('span');
  commentDateNode.setAttribute('title', commentDate.toString());
  commentDateNode.classList.add('date');
  commentDateNode.classList.add('user-tz');

  var commentTimeNode = document.createElement('time');
  commentTimeNode.setAttribute('datetime', commentDate.toJSON());
  commentTimeNode.classList.add('livestamp');
  commentTimeNode.textContent = commentDate.toString();

  commentDateNode.appendChild(commentTimeNode);
  commentDateContainer.appendChild(commentDateNode);

  actionDetailsNode.appendChild(avatarNode);
  actionDetailsNode.appendChild(document.createTextNode(' added a comment - '));
  actionDetailsNode.appendChild(commentDateContainer);

  return actionDetailsNode;
}

function getActionHead(comment) {
  var actionHeadNode = document.createElement('div');
  actionHeadNode.classList.add('action-head');

  actionHeadNode.appendChild(getActionLinks(comment));
  actionHeadNode.appendChild(getActionDetails(comment));

  return actionHeadNode;
}

function getActionBody(comment) {
  var actionBodyNode = document.createElement('div');
  actionBodyNode.classList.add('action-body');
  actionBodyNode.classList.add('flooded');

  actionBodyNode.innerHTML = comment.renderedBody;

  return actionBodyNode;
}

function addComment(comment) {
  var activityContentNode = document.querySelector('#activitymodule .mod-content')

  var activityCommentNode = document.createElement('div');
  activityCommentNode.setAttribute('id', 'comment-' + comment.id);
  activityCommentNode.classList.add('issue-data-block', 'activity-comment', 'twixi-block', 'expanded');

  var actionContainerNode = document.createElement('div');
  actionContainerNode.classList.add('twixi-wrap', 'verbose', 'actionContainer');

  actionContainerNode.appendChild(getActionHead(comment));
  actionContainerNode.appendChild(getActionBody(comment));

  activityCommentNode.appendChild(actionContainerNode);
  activityContentNode.appendChild(activityCommentNode);
}

function addComments() {
  var xhr = new XMLHttpRequest();

  xhr.addEventListener('load', function() {
    var comments = JSON.parse(this.responseText).comments;
    for (var i = 0; i < comments.length; i++) {
      addComment(comments[i]);
    }
  });

  var restURL = 'https://' + document.location.host + '/rest/api/2/issue/' + getTicketId() + '/comment?expand=renderedBody';

  xhr.open('GET', restURL);
  xhr.send();
}

function updateTicketActions() {
  var operationsContainer = document.getElementById('opsbar-opsbar-operations');

  var attachNode = document.createElement('a');
  attachNode.setAttribute('href', '/secure/AttachFile!default.jspa?id=' + getTicketId());
  attachNode.classList.add('aui-button', 'toolbar-trigger');
  attachNode.textContent = 'Attach Files';

  var linkTicketNode = document.createElement('a');

  linkTicketNode.setAttribute('href', '/secure/LinkJiraIssue!default.jspa?id=' + getTicketId());
  linkTicketNode.classList.add('aui-button', 'toolbar-trigger');
  linkTicketNode.textContent = 'Link Issue';

  operationsContainer.appendChild(attachNode);
  operationsContainer.appendChild(linkTicketNode);

  document.getElementById('opsbar-operations_more').remove();

  var transitionsContainer = document.getElementById('opsbar-opsbar-transitions');
  var hiddenTransitionNodes = document.querySelectorAll('aui-item-link.issueaction-workflow-transition');

  for (var i = 0; i < hiddenTransitionNodes.length; i++) {
    var hiddenTransitionNode = hiddenTransitionNodes[i];

    var transitionNode = document.createElement('a');
    transitionNode.setAttribute('href', hiddenTransitionNode.getAttribute('href'));
    transitionNode.classList.add('aui-button', 'toolbar-trigger', 'issueaction-workflow-transition');
    transitionNode.innerHTML = hiddenTransitionNode.innerHTML;

    transitionsContainer.appendChild(transitionNode);
  }

  document.getElementById('opsbar-transitions_more').remove();
}

function enableShowMoreLinks() {
  var showMoreLinks = document.getElementById('show-more-links');

  if (!showMoreLinks) {
    return;
  }

  function showMoreLinksListener() {
    showMoreLinks.style.visibility = 'hidden';

    var collapsedLinksLists = document.querySelectorAll('.collapsed-links-list');

    for (var i = 0; i < collapsedLinksLists.length; i++) {
      collapsedLinksLists[i].classList.remove('collapsed-links-list');
    }

    var collapsedLinks = document.querySelectorAll('.collapsed-link');

    for (var i = 0; i < collapsedLinks.length; i++) {
      collapsedLinks[i].classList.remove('collapsed-link');
    }
  }

  showMoreLinks.addEventListener('click', showMoreLinksListener);
}

function addIssueKeySelect() {
  var issueKeysLabel = document.querySelector('label[for="jira-issue-keys"]');

  var children = issueKeysLabel.parentElement.children;

  for (var i = children.length - 1; i >= 1; i--) {
    children[i].remove();
  }

  var issueKeysInput = document.createElement('input');
  issueKeysInput.setAttribute('name', 'issueKeys');
  issueKeysInput.classList.add('text', 'long-field');

  issueKeysLabel.parentElement.appendChild(issueKeysInput);
}

console.log(document.location.pathname);

if (document.location.pathname.indexOf('/browse/') == 0) {
  if (!document.querySelector('#activitymodule .aui-tabs')) {
    addComments();
    updateTicketActions();
    enableShowMoreLinks();
  }
}
else if (document.location.pathname.indexOf('/secure/LinkJiraIssue!') == 0) {
  if (!document.getElementById('jira-issue-keys-textarea')) {
    addIssueKeySelect();
  }
}