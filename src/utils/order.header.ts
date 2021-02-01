export function getOrder(order?: string) {
  let orderQuery: string[] | undefined;

  if (order)
    orderQuery = [order];
  else
    orderQuery = undefined;

  console.log(orderQuery);

  return orderQuery;
}
