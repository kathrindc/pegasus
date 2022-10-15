import axios from 'axios';

const ScryfallAPI = 'https://api.scryfall.com';
const Endpoints = {
    SearchCard: ScryfallAPI + '/cards/search',
};

export class ScryfallAPIError extends Error {
    constructor(status) {
        super(`Scryfall API returned status code ${status}`);
    }
}

export async function searchCard(name) {
    const res = await axios.get(
        Endpoints.SearchCard,
        {
            params: {
                q: name
            }
        });

    if (![200, 404].includes(res.status)) {
        throw new ScryfallAPIError(res.status);
    }

    return res.status === 200 ? res.data.data : [];
}

const Scryfall = {
    searchCard
};

export default Scryfall;
