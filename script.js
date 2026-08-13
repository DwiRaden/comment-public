// ==========================================
// SUPABASE
// ==========================================

const SUPABASE_URL =
  "https://blfkirpgfyekzzjzjdpe.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_U2at4VScoGw7vFR8MkxiQw_y9q-kGmf";

const db =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ==========================================
// ELEMENT
// ==========================================

const usernameInput =
  document.getElementById("username");

const contentInput =
  document.getElementById("content");

const sendButton =
  document.getElementById("sendButton");

const commentsContainer =
  document.getElementById("comments");

const errorBox =
  document.getElementById("errorBox");

const counter =
  document.getElementById("counter");


// ==========================================
// COUNTER
// ==========================================

contentInput.addEventListener("input", () => {

  counter.textContent =
    `${contentInput.value.length} / 500`;

});


// ==========================================
// ERROR
// ==========================================

function showError(message) {

  errorBox.textContent = message;
  errorBox.style.display = "block";

  setTimeout(() => {
    errorBox.style.display = "none";
  }, 4000);

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(text) {

  const div =
    document.createElement("div");

  div.textContent = text;

  return div.innerHTML;

}


// ==========================================
// DATE
// ==========================================

function formatDate(date) {

  return new Date(date).toLocaleString(
    "id-ID",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  );

}


// ==========================================
// LOAD
// ==========================================

async function loadComments() {

  const {
    data,
    error
  } = await db
    .from("comments")
    .select("*")
    .order("created_at", {
      ascending: true
    });

  if (error) {

    console.error(error);

    commentsContainer.innerHTML = `
      <div class="empty">
        Gagal memuat komentar.
      </div>
    `;

    return;
  }

  renderComments(data);

}


// ==========================================
// RENDER
// ==========================================

function renderComments(data) {

  commentsContainer.innerHTML = "";

  const mainComments =
    data.filter(
      comment =>
        comment.parent_id === null
    );

  if (mainComments.length === 0) {

    commentsContainer.innerHTML = `
      <div class="empty">
        Belum ada komentar.
      </div>
    `;

    return;
  }

  mainComments.forEach(comment => {

    commentsContainer.appendChild(
      createComment(comment, data)
    );

  });

}


// ==========================================
// CREATE COMMENT
// ==========================================

function createComment(
  comment,
  allComments
) {

  const wrapper =
    document.createElement("article");

  wrapper.className = "comment";

  const replies =
    allComments.filter(
      item =>
        item.parent_id === comment.id
    );

  wrapper.innerHTML = `

    <div class="comment-header">

      <span class="username">
        ${escapeHTML(comment.username)}
      </span>

      <span class="date">
        ${formatDate(comment.created_at)}
      </span>

    </div>

    <div class="comment-content">
      ${escapeHTML(comment.content)}
    </div>

    <div class="actions">

      <button
        class="reply-button"
        onclick="toggleReply(${comment.id})"
      >
        ↩ Balas
      </button>

    </div>

    <div
      class="reply-box"
      id="reply-box-${comment.id}"
    >

      <input
        id="reply-name-${comment.id}"
        maxlength="30"
        placeholder="Nama / username"
      >

      <textarea
        id="reply-content-${comment.id}"
        maxlength="500"
        placeholder="Tulis balasan..."
      ></textarea>

      <button
        class="reply-submit"
        onclick="sendReply(${comment.id})"
      >
        Kirim Balasan
      </button>

    </div>

    <div class="replies"></div>
  `;


  const repliesContainer =
    wrapper.querySelector(".replies");


  replies.forEach(reply => {

    const replyElement =
      document.createElement("div");

    replyElement.className = "reply";

    replyElement.innerHTML = `

      <div class="comment-header">

        <span class="username">
          ${escapeHTML(reply.username)}
        </span>

        <span class="date">
          ${formatDate(reply.created_at)}
        </span>

      </div>

      <div class="comment-content">
        ${escapeHTML(reply.content)}
      </div>

    `;

    repliesContainer.appendChild(
      replyElement
    );

  });


  return wrapper;

}


// ==========================================
// TOGGLE REPLY
// ==========================================

function toggleReply(id) {

  const box =
    document.getElementById(
      `reply-box-${id}`
    );

  box.classList.toggle("active");

}


// ==========================================
// SEND COMMENT
// ==========================================

async function sendComment() {

  const username =
    usernameInput.value.trim();

  const content =
    contentInput.value.trim();


  if (!username) {
    showError("Masukkan nama / username.");
    return;
  }

  if (!content) {
    showError("Komentar tidak boleh kosong.");
    return;
  }

  if (username.length > 30) {
    showError("Username maksimal 30 karakter.");
    return;
  }

  if (content.length > 500) {
    showError("Komentar maksimal 500 karakter.");
    return;
  }


  sendButton.disabled = true;
  sendButton.textContent = "Mengirim...";


  const {
    error
  } = await db
    .from("comments")
    .insert({
      username: username,
      content: content,
      parent_id: null
    });


  sendButton.disabled = false;
  sendButton.textContent = "Kirim Komentar";


  if (error) {

    console.error(error);

    showError("Komentar gagal dikirim.");

    return;
  }


  contentInput.value = "";
  counter.textContent = "0 / 500";

  await loadComments();

}


// ==========================================
// SEND REPLY
// ==========================================

async function sendReply(parentId) {

  const nameInput =
    document.getElementById(
      `reply-name-${parentId}`
    );

  const replyContentInput =
    document.getElementById(
      `reply-content-${parentId}`
    );


  const username =
    nameInput.value.trim();

  const content =
    replyContentInput.value.trim();


  if (!username) {
    showError("Masukkan nama / username.");
    return;
  }

  if (!content) {
    showError("Balasan tidak boleh kosong.");
    return;
  }

  if (username.length > 30) {
    showError("Username maksimal 30 karakter.");
    return;
  }

  if (content.length > 500) {
    showError("Balasan maksimal 500 karakter.");
    return;
  }


  const {
    error
  } = await db
    .from("comments")
    .insert({
      username: username,
      content: content,
      parent_id: parentId
    });


  if (error) {

    console.error(error);

    showError("Balasan gagal dikirim.");

    return;
  }


  await loadComments();

}


// ==========================================
// REALTIME
// ==========================================

db
  .channel("public-comments")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "comments"
    },
    () => {

      loadComments();

    }
  )
  .subscribe();


// ==========================================
// START
// ==========================================

loadComments();
