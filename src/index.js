import SimpleLightbox from "simplelightbox";
import "simplelightbox/dist/simple-lightbox.min.css";
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import axios from 'axios';

const refs = {
    form: document.querySelector('#search-form'),
    gallery: document.querySelector('.gallery'),
    loadMoreButton: document.querySelector('.load-more'),
    searchButton: document.querySelector('#search-form button'),
};

class LoadMoreButton {
    constructor({ isHiden, disabled, loading, buttonAdress }) {
        this.isHiden = isHiden;
        this.disabled = disabled;
        this.loading = loading;
        this.buttonAdress = buttonAdress;
    }
    buttonState({ isHiden = this.isHiden, disabled = this.disabled, loading = this.loading }) {
        isHiden ? this.buttonAdress.classList.add('visually-hidden') : this.buttonAdress.classList.remove('visually-hidden');
        disabled ? this.buttonAdress.disabled = true : this.buttonAdress.disabled = false;
        loading ? this.buttonAdress.textContent = 'Loading...' : this.buttonAdress.textContent = 'Load-more';
    }
}

class RequestServer {
    static url = 'https://pixabay.com/api/';
    params = {
        key: '35337679-b7947e609f482c58d47f4cd5a',
        q: '',
        image_type: 'photo',
        orientation: 'horizontal',
        safesearch: 'true',
        page: 0,
        per_page: 40
    };
    onRequestServer(query = this.params.q) {
        this.params.q = query;
        this.params.page += 1;
        return axios.get(RequestServer.url, { params: this.params });
}  
}


const requestServer = new RequestServer();
const onloadMoreButton = new LoadMoreButton({
    isHiden: true,
    disabled: true,
    loading: false,
    buttonAdress: refs.loadMoreButton
});
let totalImagesUploaded = 50;    

function markup(array) {
    return array.map(({webformatURL, largeImageURL, tags, likes, views, comments, downloads}) => 
        `<div class="gallery__item">
     <a class="gallery__link" href="${largeImageURL}">
  <img class="gallery__image" src="${webformatURL}" alt="${tags}"/>
</a>
<div class="gallery__info">
    <p class="gallery__info-item">
      <b>Likes ${likes}</b>
    </p>
    <p class="gallery__info-item">
      <b>Views ${views}</b>
    </p>
    <p class="gallery__info-item">
      <b>Comments ${comments}</b>
    </p>
    <p class="gallery__info-item">
      <b>Downloads ${downloads}</b>
    </p>
    </div>
  </div>`).join(""); 
}        

onloadMoreButton.buttonState({});

refs.form.addEventListener('submit', onSumbitForm);
refs.loadMoreButton.addEventListener('click', onSumbitLoadMore);

async function onSumbitForm(event) {
    event.preventDefault();
    const { searchQuery } = event.currentTarget.elements;
    if (!searchQuery.value.trim()) {
        Notify.info('Please, enter data to search!');
        return;
    }
    refs.searchButton.disabled = true;
    requestServer.params.page = 0;
    refs.gallery.innerHTML = '';
    onloadMoreButton.buttonState({
        isHiden: false,
        loading: true,
    });
    
    try {
        const response = await requestServer.onRequestServer(searchQuery.value);
        const { hits, totalHits } = response.data;
        
        if (!totalHits) {
            Notify.failure("Sorry, there are no images matching your search query. Please try again.");
        onloadMoreButton.buttonState({isHiden: true});
            refs.searchButton.disabled = false;
            return;
        }

        Notify.success(`Hooray! We found ${totalHits} images.`)
        refs.gallery.insertAdjacentHTML("beforeend", markup(hits));
        refs.searchButton.disabled = false;
       
        const lightbox = new SimpleLightbox('.gallery a');
        lightbox.refresh();

        if (totalHits <= 40) {
            onloadMoreButton.buttonState({
                isHiden: true,
                disabled: true,
            })
        } else {
            onloadMoreButton.buttonState({
            isHiden: false,
            disabled: false,
            loading: false,
                });
        }  
    } catch(error) {
    console.log(error);
  };
}

async function onSumbitLoadMore(event) {
     onloadMoreButton.buttonState({
        disabled: true,
         loading: true,
        isHiden: false,
     });
        try {
        const response = await requestServer.onRequestServer();
        const { hits, totalHits } = response.data;
              
        refs.gallery.insertAdjacentHTML("beforeend", markup(hits));
        onloadMoreButton.buttonState({
        isHiden: false,
        disabled: false,
        loading: false,
        });
            
         totalImagesUploaded += 40;
        if (totalImagesUploaded >= totalHits) {
            Notify.warning("We're sorry, but you've reached the end of search results.");
            onloadMoreButton.buttonState({
            isHiden: true,
            disabled: true,
            }); 
            }
        const { height: cardHeight } = document.querySelector(".gallery").firstElementChild.getBoundingClientRect();
        window.scrollBy({
        top: cardHeight * 2,
         behavior: "smooth",
        });
        const lightbox = new SimpleLightbox('.gallery a');
            lightbox.refresh();
            
    } catch (error) {
        console.log(error);
            
  };
}






 