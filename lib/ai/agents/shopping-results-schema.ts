import { SchemaType } from '@google/generative-ai';

export const productGroupSchemaForGemini = {
  type: SchemaType.OBJECT,
  properties: {
    name: {
      type: SchemaType.STRING,
    },
    shortDescription: {
      type: SchemaType.STRING,
      description: 'A short 1 liner about the product',
      nullable: true,
    },
    imageUrl: {
      type: SchemaType.STRING,
      description: 'URL of the product image from the e-commerce store where this product can be purchased',
    },
    category: {
      type: SchemaType.STRING,
    },
    stores: {
      type: SchemaType.ARRAY,
      description: 'List of stores to buy the product',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: {
            type: SchemaType.STRING,
            description: 'Name of the e-commerce store',
          },
          reason: {
            type: SchemaType.STRING,
            description: 'Why did you choose this store to buy this product?',
          },
          imageUrl: {
            type: SchemaType.STRING,
            description: 'URL of the store image. The image url should come from the e-commerce store',
          },
          shopUrl: {
            type: SchemaType.STRING,
            description: 'URL of this e-commerce store',
          },
          price: {
            type: SchemaType.NUMBER,
          },
          productURL: {
            type: SchemaType.STRING,
            description: 'The product URL to purchase from this e-commerce store',
          },
          review: {
            type: SchemaType.STRING,
            nullable: true,
          },
          originalPrice: {
            type: SchemaType.NUMBER,
            description: 'Original price of the product before any discount',
            nullable: true,
          },
          currencyCode: {
            type: SchemaType.STRING,
            description: 'short 3 letter currency code like INR, USD, EUR etc.',
          },
          currencySymbol: {
            type: SchemaType.STRING,
            description: 'Currency symbol like ₹, $, € etc.',
            nullable: true,
          },
          deliveryDetails: {
            type: SchemaType.STRING,
            description: 'Delivery details like delivery time, delivery options, etc.',
            nullable: true,
          },
          remarks: {
            type: SchemaType.STRING,
            nullable: true,
          },
          latestOffers: {
            type: SchemaType.STRING,
            description: 'Latest offers on the product',
            nullable: true,
          },
        },
        required: ['name', 'reason', 'imageUrl', 'shopUrl', 'price', 'productURL', 'currencyCode'],
      },
    },
  },
  required: ['name', 'imageUrl', 'category', 'stores'],
};

export const storeGroupSchemaForGemini = {
  description: 'List of products grouped by store',
  type: SchemaType.OBJECT,
  properties: {
    name: {
      type: SchemaType.STRING,
      description: 'Name of the e-commerce store',
    },
    imageUrl: {
      type: SchemaType.STRING,
      description: 'URL of the store image. The image url should come from the e-commerce store',
    },
    shopUrl: {
      type: SchemaType.STRING,
      description: 'URL of this e-commerce store',
    },
    products: {
      type: SchemaType.ARRAY,
      description: 'list of products from this store',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: {
            type: SchemaType.STRING,
          },
          shortDescription: {
            type: SchemaType.STRING,
            description: 'A short 1 liner about the product',
            nullable: true,
          },
          price: {
            type: SchemaType.NUMBER,
          },
          productURL: {
            type: SchemaType.STRING,
            description: 'The product URL to purchase from this e-commerce store',
          },
          imageUrl: {
            type: SchemaType.STRING,
            description: 'URL of the product image from the e-commerce store where this product can be purchased',
          },
          category: {
            type: SchemaType.STRING,
          },
          review: {
            type: SchemaType.STRING,
            nullable: true,
          },
          originalPrice: {
            type: SchemaType.NUMBER,
            description: 'Original price of the product before any discount',
            nullable: true,
          },
          currencyCode: {
            type: SchemaType.STRING,
            description: 'short 3 letter currency code like INR, USD, EUR etc.',
          },
          currencySymbol: {
            type: SchemaType.STRING,
            description: 'Currency symbol like ₹, $, € etc.',
            nullable: true,
          },
          deliveryDetails: {
            type: SchemaType.STRING,
            description: 'Delivery details like delivery time, delivery options, etc.',
            nullable: true,
          },
          remarks: {
            type: SchemaType.STRING,
            nullable: true,
          },
          latestOffers: {
            type: SchemaType.STRING,
            description: 'Latest offers on the product',
            nullable: true,
          },
        },
        required: ['name', 'price', 'productURL', 'imageUrl', 'category', 'currencyCode'],
      },
    },
  },
  required: ['name', 'imageUrl', 'shopUrl', 'products'],
};
// Add this after the existing schemas
export const shoppingResultsSchemaForGemini = {
  type: SchemaType.OBJECT,
  properties: {
    summary: {
      type: SchemaType.STRING,
      description: 'Summary of the all shopping results and recommendations',
    },
    productsGroup: {
      type: SchemaType.ARRAY,
      description:
        'List of products grouped by product name from various e-commerce stores. This is helpful to compare the prices, offers, delivery details of the same product across different e-commerce stores',
      items: productGroupSchemaForGemini,
    },
    storeGroup: {
      type: SchemaType.ARRAY,
      description: 'List of products grouped by store',
      items: storeGroupSchemaForGemini,
    },
  },
  required: ['summary', 'productsGroup', 'storeGroup'],
};
