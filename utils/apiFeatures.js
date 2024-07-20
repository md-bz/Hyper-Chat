class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        let filteredQuery = { ...this.queryString };
        const excludedFields = ["page", "sort", "limit", "fields"];
        excludedFields.forEach((element) => delete filteredQuery[element]);

        filteredQuery = JSON.stringify(filteredQuery).replace(
            /\b(gte|gt|lte|lt)\b/g,
            (match) => `$${match}`
        );

        this.query.find(JSON.parse(filteredQuery));
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.replace(/,/g, " ");
            this.query.sort(sortBy);
        } else {
            this.query.sort("-ratingsAverage");
        }
        return this;
    }

    limitFields() {
        if (this.queryString.field) {
            const fields = this.queryString.field.replace(/,/g, " ");
            this.query.select(fields);
        } else {
            this.query.select("-__v");
        }
        return this;
    }

    paginate() {
        const page = this.queryString.page;
        const limit = this.queryString.limit ? this.queryString.limit : 5;
        const skip = limit * (page > 0 ? page - 1 : 0);
        this.query.skip(skip).limit(limit);
        return this;
    }
}

module.exports = APIFeatures;
