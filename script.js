// ============================================
// SUPABASE
// ============================================

const SUPABASE_URL =
  "https://blfkirpgfyekzzjzjdpe.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_U2at4VScoGw7vFR8MkxiQw_y9q-kGmf";

const db =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ============================================
// STATE
// ============================================

let selectedGeneration = "";


// ============================================
// ELEMENTS
// ============================================

const notice =
  document.getElementById("notice");

const recipient =
  document.getElementById("recipient");

const sender =
  document.getElementById("sender");

const message =
  document.getElementById("message");

const messageCounter =
  document.getElementById("messageCounter");

const sendBtn =
  document.getElementById("sendBtn");

const searchName =
  document.getElementById("searchName");

const searchBtn =
  document.getElementById("searchBtn");

const results =
  document.getElementById("results");


// ============================================
// NOTICE
// ============================================

let noticeTimeout;

function showNotice(
  text,
  success = false
) {

  clearTimeout(noticeTimeout);

  notice.textContent = text;

  notice.className =
    "notice show" +
    (success ? " success" : "");

  noticeTimeout =
    setTimeout(() => {

      notice.className = "notice";

    }, 4500);
}


// ============================================
// ESCAPE HTML
// ============================================

function escapeHTML(value) {

  const div =
    document.createElement("div");

  div.textContent =
    String(value ?? "");

  return div.innerHTML;
}


// ============================================
// PAGE
// ============================================

function showPage(pageId) {

  document
    .querySelectorAll(".page")
    .forEach(page => {

      page.classList.remove("active");

    });


  const page =
    document.getElementById(pageId);


  if (page) {

    page.classList.add("active");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }

}


// ============================================
// QUICK GENERATION
// ============================================

function quickGeneration(generation) {

  showPage("sendPage");

  selectGeneration(generation);

}


// ============================================
// SELECT GENERATION
// ============================================

function selectGeneration(generation) {

  selectedGeneration =
    generation;


  document
    .querySelectorAll(
      ".generation-select button"
    )
    .forEach(button => {

      button.classList.toggle(
        "selected",
        button.dataset.generation ===
        generation
      );

    });

}


// ============================================
// ANONYMOUS
// ============================================

function setAnonymous() {

  sender.value = "Anonymous";

}


// ============================================
// COUNTER
// ============================================

message.addEventListener(
  "input",
  () => {

    messageCounter.textContent =
      `${message.value.length} / 500`;

  }
);


// ============================================
// SEND MESSAGE
// ============================================

async function sendMessage() {

  const to =
    recipient.value.trim();

  const from =
    sender.value.trim() ||
    "Anonymous";

  const content =
    message.value.trim();


  if (!selectedGeneration) {

    showNotice(
      "Pilih angkatan terlebih dahulu."
    );

    return;
  }


  if (!to) {

    showNotice(
      "Masukkan nama penerima."
    );

    recipient.focus();

    return;
  }


  if (!content) {

    showNotice(
      "Pesan tidak boleh kosong."
    );

    message.focus();

    return;
  }


  sendBtn.disabled = true;

  sendBtn.textContent =
    "Mengirim...";


  const { error } =
    await db
      .from("messages")
      .insert({

        sender: from,

        recipient: to,

        generation:
          selectedGeneration,

        content: content

      });


  if (error) {

    console.error(error);

    showNotice(
      "Gagal mengirim pesan: " +
      error.message
    );

    sendBtn.disabled = false;

    sendBtn.textContent =
      "Kirim 💌";

    return;
  }


  recipient.value = "";

  message.value = "";

  messageCounter.textContent =
    "0 / 500";


  showNotice(
    "Pesan berhasil dikirim! 💌",
    true
  );


  sendBtn.textContent =
    "Terkirim ✓";


  setTimeout(() => {

    sendBtn.disabled = false;

    sendBtn.textContent =
      "Kirim 💌";

  }, 1200);

}


// ============================================
// SEARCH
// ============================================

async function searchMessages() {

  const name =
    searchName.value.trim();


  if (!name) {

    showNotice(
      "Masukkan nama yang ingin dicari."
    );

    return;
  }


  searchBtn.disabled = true;

  searchBtn.textContent =
    "Mencari...";


  results.innerHTML = `
    <div class="empty">
      Mencari pesan...
    </div>
  `;


  const { data, error } =
    await db.rpc(
      "search_messages",
      {
        p_recipient: name
      }
    );


  if (error) {

    console.error(error);

    results.innerHTML = `
      <div class="empty">
        Gagal mencari pesan.
      </div>
    `;

    showNotice(
      "Gagal mencari pesan: " +
      error.message
    );

    searchBtn.disabled = false;

    searchBtn.textContent =
      "Cari";

    return;
  }


  renderMessages(
    data || [],
    name
  );


  searchBtn.disabled = false;

  searchBtn.textContent =
    "Cari";

}


// ============================================
// RENDER MESSAGES
// ============================================

function renderMessages(
  messages,
  name
) {

  results.innerHTML = "";


  if (!messages.length) {

    results.innerHTML = `
      <div class="empty">
        Belum ada pesan untuk
        <strong>${escapeHTML(name)}</strong>.
      </div>
    `;

    return;
  }


  const title =
    document.createElement("div");

  title.className =
    "result-title";

  title.textContent =
    `${messages.length} pesan untuk ${name}`;

  results.appendChild(title);


  messages.forEach(
    item => {

      results.appendChild(
        createMessageCard(item)
      );

    }
  );

}


// ============================================
// MESSAGE CARD
// ============================================

function createMessageCard(item) {

  const card =
    document.createElement("article");

  card.className =
    "message";


  const generation =
    generationName(
      item.generation
    );


  card.innerHTML = `

    <div class="message-head">

      <div>

        <div class="sender">
          ${escapeHTML(item.sender)}
        </div>

        <div class="recipient-info">
          Untuk ${escapeHTML(item.recipient)}
        </div>

      </div>

      <div class="time">
        ${formatDate(item.created_at)}
      </div>

    </div>


    <div class="message-content">
      ${escapeHTML(item.content)}
    </div>


    <span class="generation-tag">
      ${generation}
    </span>


    <br>


    <button
      class="reply-button"
      onclick="openReply(
        ${item.id},
        '${escapeAttribute(item.recipient)}'
      )"
    >
      ↩ Balas pesan
    </button>


    <div
      class="reply-box"
      id="reply-${item.id}"
    >

      <input
        id="reply-name-${item.id}"
        maxlength="30"
        placeholder="Nama kamu"
      >

      <textarea
        id="reply-content-${item.id}"
        maxlength="500"
        placeholder="Tulis balasan..."
      ></textarea>

      <button
        class="reply-send"
        onclick="sendReply(
          ${item.id},
          '${escapeAttribute(item.recipient)}',
          '${escapeAttribute(item.generation)}'
        )"
      >
        Kirim Balasan
      </button>

    </div>

  `;


  return card;

}


// ============================================
// OPEN REPLY
// ============================================

function openReply(
  id
) {

  const box =
    document.getElementById(
      `reply-${id}`
    );


  if (box) {

    box.classList.toggle(
      "active"
    );

  }

}


// ============================================
// SEND REPLY
// ============================================

async function sendReply(
  id,
  recipientName,
  generation
) {

  const nameInput =
    document.getElementById(
      `reply-name-${id}`
    );

  const contentInput =
    document.getElementById(
      `reply-content-${id}`
    );


  const from =
    nameInput.value.trim() ||
    "Anonymous";

  const content =
    contentInput.value.trim();


  if (!content) {

    showNotice(
      "Balasan tidak boleh kosong."
    );

    return;
  }


  const { error } =
    await db
      .from("messages")
      .insert({

        sender: from,

        recipient: recipientName,

        generation:
          generation,

        content:
          content

      });


  if (error) {

    console.error(error);

    showNotice(
      "Gagal mengirim balasan: " +
      error.message
    );

    return;
  }


  contentInput.value = "";

  showNotice(
    "Balasan berhasil dikirim! 💬",
    true
  );

}


// ============================================
// GENERATION NAME
// ============================================

function generationName(value) {

  const names = {

    angkatan_11:
      "ANGKATAN 11",

    angkatan_12:
      "ANGKATAN 12",

    angkatan_13:
      "ANGKATAN 13"

  };


  return names[value] ||
    value ||
    "ANGKATAN";

}


// ============================================
// DATE
// ============================================

function formatDate(value) {

  return new Date(value)
    .toLocaleString(
      "id-ID",
      {
        dateStyle: "medium",
        timeStyle: "short"
      }
    );

}


// ============================================
// ESCAPE ATTRIBUTE
// ============================================

function escapeAttribute(value) {

  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
}


// ============================================
// REALTIME
// ============================================

db.channel("messages-realtime")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "messages"
    },
    payload => {

      const currentName =
        searchName.value.trim();


      if (
        currentName &&
        payload.new &&
        String(payload.new.recipient)
          .toLowerCase() ===
        currentName.toLowerCase()
      ) {

        searchMessages();

      }

    }
  )
  .subscribe();


// ============================================
// ENTER = SEARCH
// ============================================

searchName.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      searchMessages();

    }

  }
);