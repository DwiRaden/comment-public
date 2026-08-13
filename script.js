// ======================================================
// SUPABASE
// ======================================================

const SUPABASE_URL =
  "https://blfkirpgfyekzzjzjdpe.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_U2at4VScoGw7vFR8MkxiQw_y9q-kGmf";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ======================================================
// ELEMENTS
// ======================================================

const notice =
  document.getElementById("notice");

const connectionStatus =
  document.getElementById("connectionStatus");


// COMMENT
const usernameInput =
  document.getElementById("username");

const contentInput =
  document.getElementById("content");

const counter =
  document.getElementById("counter");

const sendButton =
  document.getElementById("sendButton");

const commentsContainer =
  document.getElementById("comments");


// MESSAGE
const messageSender =
  document.getElementById("messageSender");

const messageRecipient =
  document.getElementById("messageRecipient");

const recipientCode =
  document.getElementById("recipientCode");

const messageContent =
  document.getElementById("messageContent");

const messageCounter =
  document.getElementById("messageCounter");

const sendMessageButton =
  document.getElementById("sendMessageButton");


// SEARCH
const searchCode =
  document.getElementById("searchCode");

const searchButton =
  document.getElementById("searchButton");

const messageResults =
  document.getElementById("messageResults");


// ======================================================
// NOTICE
// ======================================================

let noticeTimer;

function showNotice(
  message,
  success = false
) {

  clearTimeout(noticeTimer);

  notice.textContent = message;

  notice.className =
    "notice show" +
    (success ? " success" : "");

  noticeTimer =
    setTimeout(() => {

      notice.className =
        "notice";

    }, 5000);
}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(text) {

  const div =
    document.createElement("div");

  div.textContent =
    String(text ?? "");

  return div.innerHTML;
}


// ======================================================
// DATE
// ======================================================

function formatDate(date) {

  return new Date(date).toLocaleString(
    "id-ID",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  );

}


// ======================================================
// HASH KODE PENERIMA
// HARUS SAMA DENGAN PostgreSQL SHA-256
// ======================================================

async function hashRecipientCode(code) {

  const normalized =
    code.trim();

  const encoder =
    new TextEncoder();

  const data =
    encoder.encode(normalized);

  const hashBuffer =
    await crypto.subtle.digest(
      "SHA-256",
      data
    );

  const hashArray =
    Array.from(
      new Uint8Array(hashBuffer)
    );

  return hashArray
    .map(
      byte =>
        byte
          .toString(16)
          .padStart(2, "0")
    )
    .join("");
}


// ======================================================
// COUNTERS
// ======================================================

contentInput.addEventListener(
  "input",
  () => {

    counter.textContent =
      `${contentInput.value.length} / 500`;

  }
);


messageContent.addEventListener(
  "input",
  () => {

    messageCounter.textContent =
      `${messageContent.value.length} / 500`;

  }
);


// ======================================================
// COMMENTS
// ======================================================

async function loadComments() {

  const {
    data,
    error
  } = await supabaseClient
    .from("comments")
    .select("*")
    .order("created_at", {
      ascending: false
    });


  if (error) {

    console.error(
      "LOAD COMMENTS:",
      error
    );

    commentsContainer.innerHTML = `
      <div class="empty">
        Gagal memuat komentar.
        <br>
        <small>
          ${escapeHTML(error.message)}
        </small>
      </div>
    `;

    return;
  }


  renderComments(data || []);

}


// ======================================================
// RENDER COMMENTS
// ======================================================

function renderComments(data) {

  commentsContainer.innerHTML = "";


  const mainComments =
    data.filter(
      comment =>
        comment.parent_id === null
    );


  if (
    mainComments.length === 0
  ) {

    commentsContainer.innerHTML = `
      <div class="empty">
        Belum ada komentar.
      </div>
    `;

    return;
  }


  mainComments.forEach(
    comment => {

      commentsContainer.appendChild(
        createComment(
          comment,
          data
        )
      );

    }
  );

}


// ======================================================
// CREATE COMMENT
// ======================================================

function createComment(
  comment,
  allComments
) {

  const wrapper =
    document.createElement("article");

  wrapper.className =
    "comment";


  const replies =
    allComments
      .filter(
        item =>
          item.parent_id === comment.id
      )
      .sort(
        (a, b) =>
          new Date(b.created_at) -
          new Date(a.created_at)
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
        autocomplete="off"
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
    wrapper.querySelector(
      ".replies"
    );


  replies.forEach(
    reply => {

      const replyElement =
        document.createElement(
          "div"
        );

      replyElement.className =
        "reply";


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

    }
  );


  return wrapper;
}


// ======================================================
// SEND COMMENT
// ======================================================

async function sendComment() {

  const username =
    usernameInput.value.trim();

  const content =
    contentInput.value.trim();


  if (!username) {

    showNotice(
      "Masukkan nama / username."
    );

    return;
  }


  if (!content) {

    showNotice(
      "Komentar tidak boleh kosong."
    );

    return;
  }


  sendButton.disabled = true;

  sendButton.textContent =
    "Mengirim...";


  const {
    error
  } = await supabaseClient
    .from("comments")
    .insert({

      username,
      content,
      parent_id: null

    });


  if (error) {

    console.error(
      "SEND COMMENT:",
      error
    );

    showNotice(
      "Gagal mengirim: " +
      error.message
    );

    sendButton.disabled =
      false;

    sendButton.textContent =
      "Kirim Komentar";

    return;
  }


  contentInput.value = "";

  counter.textContent =
    "0 / 500";


  sendButton.textContent =
    "Terkirim ✓";


  showNotice(
    "Komentar berhasil dikirim!",
    true
  );


  await loadComments();


  setTimeout(() => {

    sendButton.textContent =
      "Kirim Komentar";

    sendButton.disabled =
      false;

  }, 1000);

}


// ======================================================
// REPLY
// ======================================================

function toggleReply(id) {

  const box =
    document.getElementById(
      `reply-box-${id}`
    );


  if (!box) return;


  box.classList.toggle(
    "active"
  );

}


async function sendReply(parentId) {

  const nameInput =
    document.getElementById(
      `reply-name-${parentId}`
    );

  const contentInputReply =
    document.getElementById(
      `reply-content-${parentId}`
    );


  const username =
    nameInput.value.trim();

  const content =
    contentInputReply.value.trim();


  if (!username) {

    showNotice(
      "Masukkan nama / username."
    );

    return;
  }


  if (!content) {

    showNotice(
      "Balasan tidak boleh kosong."
    );

    return;
  }


  const {
    error
  } = await supabaseClient
    .from("comments")
    .insert({

      username,
      content,
      parent_id: parentId

    });


  if (error) {

    console.error(
      "SEND REPLY:",
      error
    );

    showNotice(
      "Gagal mengirim balasan: " +
      error.message
    );

    return;
  }


  showNotice(
    "Balasan berhasil dikirim!",
    true
  );


  await loadComments();

}


// ======================================================
// SEND MESSAGE
// ======================================================

async function sendMessage() {

  const sender =
    messageSender.value.trim();

  const recipient =
    messageRecipient.value.trim();

  const code =
    recipientCode.value.trim();

  const content =
    messageContent.value.trim();


  if (!sender) {

    showNotice(
      "Masukkan nama pengirim."
    );

    return;
  }


  if (!recipient) {

    showNotice(
      "Masukkan nama penerima."
    );

    return;
  }


  if (!code) {

    showNotice(
      "Masukkan kode penerima."
    );

    return;
  }


  if (code.length < 6) {

    showNotice(
      "Kode penerima minimal 6 karakter."
    );

    return;
  }


  if (!content) {

    showNotice(
      "Pesan tidak boleh kosong."
    );

    return;
  }


  sendMessageButton.disabled =
    true;

  sendMessageButton.textContent =
    "Mengirim...";


  try {

    const codeHash =
      await hashRecipientCode(
        code
      );


    const {
      error
    } = await supabaseClient
      .from("messages")
      .insert({

        sender: sender,

        recipient: recipient,

        recipient_code_hash:
          codeHash,

        content: content

      });


    if (error) {

      console.error(
        "SEND MESSAGE:",
        error
      );

      showNotice(
        "Gagal mengirim pesan: " +
        error.message
      );

      return;
    }


    messageContent.value = "";

    messageCounter.textContent =
      "0 / 500";


    sendMessageButton.textContent =
      "Terkirim ✓";


    showNotice(
      "Pesan berhasil dikirim!",
      true
    );


  } catch (error) {

    console.error(
      "MESSAGE ERROR:",
      error
    );

    showNotice(
      "Gagal memproses kode penerima."
    );

  } finally {

    setTimeout(() => {

      sendMessageButton.disabled =
        false;

      sendMessageButton.textContent =
        "Kirim Pesan";

    }, 1000);

  }

}


// ======================================================
// SEARCH MESSAGES
// ======================================================

async function searchMessages() {

  const code =
    searchCode.value.trim();


  if (!code) {

    showNotice(
      "Masukkan kode penerima."
    );

    return;
  }


  if (code.length < 6) {

    showNotice(
      "Kode penerima minimal 6 karakter."
    );

    return;
  }


  searchButton.disabled =
    true;

  searchButton.textContent =
    "Mencari...";


  messageResults.innerHTML = `
    <div class="loading">
      Mencari pesan...
    </div>
  `;


  try {

    const {
      data,
      error
    } = await supabaseClient
      .rpc(
        "get_my_messages",
        {
          p_recipient_code:
            code
        }
      );


    if (error) {

      console.error(
        "SEARCH MESSAGE:",
        error
      );

      messageResults.innerHTML = `
        <div class="empty">
          Gagal mencari pesan.
        </div>
      `;

      showNotice(
        "Gagal mencari pesan: " +
        error.message
      );

      return;
    }


    renderMessages(
      data || []
    );


  } catch (error) {

    console.error(
      error
    );

    messageResults.innerHTML = `
      <div class="empty">
        Terjadi kesalahan.
      </div>
    `;

  } finally {

    searchButton.disabled =
      false;

    searchButton.textContent =
      "Cari";

  }

}


// ======================================================
// RENDER MESSAGES
// ======================================================

function renderMessages(
  messages
) {

  messageResults.innerHTML = "";


  if (
    messages.length === 0
  ) {

    messageResults.innerHTML = `
      <div class="empty">
        Tidak ada pesan untuk kode tersebut.
      </div>
    `;

    return;
  }


  messages.forEach(
    message => {

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "message-item";


      item.innerHTML = `

        <div class="message-top">

          <div>

            <div class="message-from">
              ${escapeHTML(message.sender)}
            </div>

            <div class="message-to">
              Untuk: ${escapeHTML(message.recipient)}
            </div>

          </div>

          <span class="date">
            ${formatDate(message.created_at)}
          </span>

        </div>

        <div class="message-text">
          ${escapeHTML(message.content)}
        </div>

      `;


      messageResults.appendChild(
        item
      );

    }
  );

}


// ======================================================
// BUTTON EVENTS
// ======================================================

sendButton.addEventListener(
  "click",
  sendComment
);

sendMessageButton.addEventListener(
  "click",
  sendMessage
);

searchButton.addEventListener(
  "click",
  searchMessages
);


// ======================================================
// REALTIME COMMENTS
// ======================================================

supabaseClient
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
  .subscribe(
    status => {

      if (
        status === "SUBSCRIBED"
      ) {

        connectionStatus.textContent =
          "● Online";

        connectionStatus.style.color =
          "#4ade80";

      } else {

        connectionStatus.textContent =
          "● Offline";

        connectionStatus.style.color =
          "#f87171";

      }

    }
  );


// ======================================================
// START
// ======================================================

loadComments();