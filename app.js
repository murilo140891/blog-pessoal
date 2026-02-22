document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const categoryButtons = document.querySelectorAll('.filter__button');
    const postsFeed = document.getElementById('postsFeed');
    const paginationControls = document.getElementById('paginationControls');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    const PAGE_SIZE = 5;
    let currentCategory = 'all';
    let currentSearch = '';
    let currentPage = 1;

    // Load posts from injected data or feed.json fallback
    let postsData = window.POSTS_DATA && window.POSTS_DATA.length ? window.POSTS_DATA : [];

    if (postsData.length > 0) {
        renderFeed();
    } else {
        fetch('feed.json')
            .then(res => res.json())
            .then(data => {
                postsData = data;
                renderFeed();
            })
            .catch(err => console.error("Could not load feed.json", err));
    }

    // Global Snackbar logic
    window.showSnackbar = function (message) {
        let snackbar = document.getElementById('snackbar');
        if (!snackbar) {
            snackbar = document.createElement('div');
            snackbar.id = 'snackbar';
            snackbar.className = 'snackbar';
            document.body.appendChild(snackbar);
        }
        snackbar.textContent = message;
        snackbar.classList.add('show');
        setTimeout(() => {
            snackbar.classList.remove('show');
        }, 3000);
    };

    function renderFeed() {
        if (!postsFeed || !postsData.length) return;

        // First, filter all posts
        const filteredPosts = postsData.filter(post => {
            const categories = post.categories || [];
            const title = (post.title || '').toLowerCase();
            const contentText = (post.content || '').replace(/<[^>]*>?/gm, '').toLowerCase();

            const matchesCategory = currentCategory === 'all' || categories.includes(currentCategory);
            const matchesSearch = currentSearch === '' || title.includes(currentSearch) || contentText.includes(currentSearch);

            return matchesCategory && matchesSearch;
        });

        // Calculate pagination
        const totalPages = Math.ceil(filteredPosts.length / PAGE_SIZE) || 1;
        if (currentPage > totalPages) currentPage = totalPages;

        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        const postsToShow = filteredPosts.slice(startIndex, endIndex);

        // Render HTML
        postsFeed.innerHTML = postsToShow.map(post => `
            <article class="feed__item" id="post-capture-${post.slug}" data-categories="${post.categories.join(',')}" data-title="${post.title.toLowerCase()}" data-raw-title="${post.title}">
                <div class="feed__item-avatar">
                    <div class="avatar-circle"></div>
                </div>
                <div class="feed__item-content">
                    <header class="feed__item-header">
                        <div class="feed__item-meta">
                            <span class="user-name">Murilo Frizanco</span>
                            <span class="author-tag">@murilofrizanco</span>
                            <span class="dot-separator">·</span>
                            <time class="feed__item-date">${post.formattedDate}</time>
                        </div>
                    </header>
                    <div class="feed__item-body">
                        ${post.content}
                    </div>
                    <footer class="feed__item-footer">
                        <div class="feed-actions">
                            <button class="compact-action-btn" onclick="copyFeedPostText(this)" title="Copiar Texto">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            </button>
                            <button class="compact-action-btn" onclick="copyImageToClipboard('post-capture-${post.slug}')" title="Compartilhar Imagem">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            </button>
                        </div>
                        <a href="posts/${post.slug}.html" class="read-more-link">Visualizar post completo</a>
                    </footer>
                </div>
            </article>
        `).join('');

        // Trigger reflow for animations
        const renderedItems = document.querySelectorAll('.feed__item');
        renderedItems.forEach(post => {
            post.style.animation = 'none';
            post.offsetHeight; /* trigger reflow */
            post.style.animation = null;
        });

        // Update pagination UI
        if (filteredPosts.length > PAGE_SIZE) {
            paginationControls.style.display = 'flex';
            pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;

            prevPageBtn.disabled = currentPage === 1;
            nextPageBtn.disabled = currentPage === totalPages;
        } else {
            paginationControls.style.display = 'none';
        }
    }

    if (prevPageBtn && nextPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderFeed();
                window.scrollTo({ top: document.getElementById('postsFeed').offsetTop - 20, behavior: 'smooth' });
            }
        });

        nextPageBtn.addEventListener('click', () => {
            currentPage++;
            renderFeed();
            window.scrollTo({ top: document.getElementById('postsFeed').offsetTop - 20, behavior: 'smooth' });
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            currentPage = 1; // Reset to page 1 on search
            renderFeed();
        });
    }

    if (categoryButtons) {
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                categoryButtons.forEach(btn => btn.classList.remove('filter__button--active'));
                button.classList.add('filter__button--active');

                currentCategory = button.getAttribute('data-category');
                currentPage = 1; // Reset to page 1 on filter
                renderFeed();
            });
        });
    }
});

// Global functions for feed item actions
window.copyFeedPostText = function (buttonElem) {
    const article = buttonElem.closest('.feed__item');
    const title = article.getAttribute('data-raw-title');
    const contentBody = article.querySelector('.feed__item-body').innerText.trim();
    const fullText = `${title}\n\n${contentBody}\n\n@murilofrizanco`;

    navigator.clipboard.writeText(fullText).then(() => {
        showSnackbar('Texto copiado com sucesso!');
    }).catch(err => {
        console.error('Falha ao copiar texto: ', err);
        showSnackbar('Falha ao copiar texto.');
    });
};

window.copyDetailPostText = function () {
    const postTitleElement = document.querySelector('.post-detail__title');
    const title = postTitleElement ? postTitleElement.innerText.trim() : document.title.replace('Reflexões | ', '').replace(' | Reflexões', '');
    const contentBody = document.getElementById('post-content-body').innerText.trim();
    const fullText = `${title}\n\n${contentBody}\n\n@murilofrizanco`;

    navigator.clipboard.writeText(fullText).then(() => {
        showSnackbar('Texto copiado com sucesso!');
    }).catch(err => {
        console.error('Falha ao copiar texto: ', err);
        showSnackbar('Falha ao copiar texto.');
    });
};

window.copyImageToClipboard = function (elementId) {
    const captureArea = document.getElementById(elementId);
    if (!captureArea) return;

    // Check context
    const isFeedItem = captureArea.classList.contains('feed__item');

    // Store original styles
    const originalBorder = captureArea.style.borderBottom;
    const originalBg = captureArea.style.backgroundColor;
    const originalPadding = captureArea.style.padding;
    const originalBoxShadow = captureArea.style.boxShadow;
    const originalRadius = captureArea.style.borderRadius;
    const originalBorderFull = captureArea.style.border;

    // Set temp styles for capture
    if (isFeedItem) {
        captureArea.style.borderBottom = 'none';
        captureArea.style.backgroundColor = '#0A0922'; // Use the main background
        captureArea.style.padding = '32px';
    } else {
        captureArea.style.border = 'none';
        captureArea.style.borderRadius = '0';
        captureArea.style.boxShadow = 'none';
        captureArea.style.padding = '64px';
    }

    // Hide actions & read more link temporarily
    const footer = captureArea.querySelector('.feed__item-footer');
    if (footer) footer.style.display = 'none';

    domtoimage.toBlob(captureArea, {
        bgcolor: '#0A0922',
        style: {
            margin: '0',
            transform: 'scale(1)',
            transformOrigin: 'top left'
        },
        width: captureArea.offsetWidth,
        height: captureArea.offsetHeight
    }).then(blob => {
        // Restore styles
        if (isFeedItem) {
            captureArea.style.borderBottom = originalBorder;
            captureArea.style.backgroundColor = originalBg;
            captureArea.style.padding = originalPadding;
        } else {
            captureArea.style.border = originalBorderFull;
            captureArea.style.borderRadius = originalRadius;
            captureArea.style.boxShadow = originalBoxShadow;
            captureArea.style.padding = originalPadding;
        }
        if (footer) footer.style.display = 'flex';

        if (!blob) {
            showSnackbar('Erro ao gerar a imagem.');
            return;
        }
        try {
            navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]).then(() => {
                showSnackbar('Imagem copiada para a área de transferência!');
            }).catch(err => {
                console.error('Erro na API nativa do Clipboard:', err);
                showSnackbar('Acesso a cópia negado. Site requer HTTPS para transferências de imagem.');
            });
        } catch (err) {
            console.error('Erro no ClipboardItem:', err);
            showSnackbar('Cópia de imagem não suportada no seu navegador local.');
        }
    }).catch(function (error) {
        console.error('Ocorreu um erro ao gerar a imagem:', error);

        // Restore styles even on error
        if (isFeedItem) {
            captureArea.style.borderBottom = originalBorder;
            captureArea.style.backgroundColor = originalBg;
            captureArea.style.padding = originalPadding;
        } else {
            captureArea.style.border = originalBorderFull;
            captureArea.style.borderRadius = originalRadius;
            captureArea.style.boxShadow = originalBoxShadow;
            captureArea.style.padding = originalPadding;
        }
        if (footer) footer.style.display = 'flex';

        showSnackbar('Erro fatal ao capturar postagem.');
    });
};
