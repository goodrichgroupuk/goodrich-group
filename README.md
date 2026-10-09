# Goodrich Group

Helping good people get rich.

Public gallery of court sheets. People file a JPEG of an order they won. Nothing is public until it is approved.

## Domain

The custom domain for this repository is `goodrichgroup.co.uk`.

GitHub Pages only serves fixed files. Filing a sheet, the review queue, and saved pictures need a server, so Pages cannot be the live site that keeps uploaded sheets.

The `CNAME` file tells GitHub the domain name. It does not change the domain's DNS. That is done at the company the domain was bought from.

If you still turn Pages on, these records point the domain at GitHub:

| Type | Name | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| AAAA | @ | 2606:50c0:8000::153 |
| AAAA | @ | 2606:50c0:8001::153 |
| AAAA | @ | 2606:50c0:8002::153 |
| AAAA | @ | 2606:50c0:8003::153 |
| CNAME | www | goodrichgroupuk.github.io |

Then in the repository: Settings, Pages, deploy from the `main` branch, and set the custom domain to `goodrichgroup.co.uk`.
