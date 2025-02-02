#### URL

{{ uri }}

#### Methods

{{ methods }}

#### Middlewares

{% if middlewares.length > 0 %}
{% for middleware in middlewares %}

* {{ middleware }}
{% endfor %}
{% else %}
Nenhum
{% endif %}

#### Action

{{ action }}

{% if domain %}

#### Domain

{{ domain }}
{% endif %}
